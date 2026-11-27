import { cache } from 'react'

import { mapWithConcurrency } from '@/lib/concurrency'
import { allowContentFetchFailure } from '@/lib/content-fetch-fallback'
import { env } from '@/lib/env'
import {
  FALLBACK_PRESS_SNAPSHOT_PATH,
  getFallbackPressSnapshot,
  getPressSnapshot,
  type PressSnapshot,
} from '@/lib/press-snapshot'
import { getPressPreviewSlugs } from '@/lib/press-preview'
import { fetchDiscourseTopic, type BlogDiscussion } from '@/lib/discourse-topic'
import { logger } from '@/lib/logger'
import { mediaFragmentHref } from '@/lib/media-anchors'
import { youtubeEmbedUrl } from '@/lib/media-embed'
import { sanitiseMediaArticle, sanitiseMediaPodcast } from '@/lib/media-html'
import { resolveAudioFromApplePodcasts } from '@/lib/podcast-feed'

export type { BlogDiscussion, BlogDiscussionPost } from '@/lib/discourse-topic'

export const DEFAULT_PODCAST_SHOW_SLUG = 'logos-state'
/** Details are fetched a few at a time: a burst trips the CMS. */
const DETAIL_FETCH_CONCURRENCY = 6

/**
 * Both slug sources cap a single response at 100 posts, so the archive has to
 * be read one page at a time. Stopping at the first page would silently drop
 * the oldest posts from the sitemap, the feeds and the static export the day
 * the archive outgrows the cap.
 */
const SLUG_PAGE_SIZE = 100
/** Safety valve: 100 full pages is far beyond any realistic archive. */
const MAX_SLUG_PAGES = 100
/** Slugs become file names in the static export and the RSS output. Mixed case
 * stays: the archive has `April-progress`. */
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i

export function isSafeSlug(slug: string): boolean {
  return SAFE_SLUG.test(slug)
}

function keepSafeSlug(label: string, slug: string): boolean {
  if (isSafeSlug(slug)) return true
  logger.warn(`Skipping ${label} with an unsafe slug`, { slug })
  return false
}
/**
 * The blog CMS. Its address is public and the same for every build, so it
 * lives here; only the API key is configuration.
 */
export const CMS_PRESS_ORIGIN = 'https://cms-press.logos.co'
const CMS_PRESS_GRAPHQL_URL = `${CMS_PRESS_ORIGIN}/graphql`
const BODY_SNIPPET_LIMIT = 200
/** About 28 times the largest article HTML file in the snapshot (73 KB). */
export const MAX_HTML_FILE_BYTES = 2 * 1024 * 1024

/** Only Strapi uploads may be downloaded and published as article HTML. */
export function resolvePressUploadUrl(rawUrl: string): string {
  const url = new URL(rawUrl, CMS_PRESS_ORIGIN)
  if (
    url.origin !== CMS_PRESS_ORIGIN ||
    !url.pathname.startsWith('/uploads/')
  ) {
    throw new Error(
      `Refusing HTML file outside ${CMS_PRESS_ORIGIN}/uploads/: ${rawUrl}`
    )
  }
  return url.href
}

/** Downloads an article HTML upload without following redirects, capped in size. */
export async function fetchPressHtmlFile(
  rawUrl: string,
  label: string
): Promise<string> {
  const url = resolvePressUploadUrl(rawUrl)
  const response = await fetch(url, { cache: 'force-cache', redirect: 'error' })
  if (!response.ok || !response.body) {
    throw new Error(`${label} failed: status=${response.status} url=${url}`)
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_HTML_FILE_BYTES) {
      await reader.cancel()
      throw new Error(
        `${label} is larger than ${MAX_HTML_FILE_BYTES} bytes: url=${url}`
      )
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export interface BlogTag {
  id: string
  name: string
}

export interface BlogAuthor {
  id: string
  name: string
}

export interface BlogImage {
  url: string
  alt: string
  width: number
  height: number
  caption?: string
  /** Responsive local variants, filled in by lib/media-images at render. */
  srcSet?: string
}

export interface BlogTocItem {
  level: number
  tag: string
  href: string
  title: string
  blockIndex: number
}

export interface BlogFootnote {
  id: string
  index: number
  refId: string
  refValue: string
  valueHTML: string
  valueText: string
}

export interface BlogTextBlock {
  type: 'text'
  id?: string
  order: number
  tagName: string
  html: string
  text: string
  labels: string[]
  classNames?: string[]
  footnotes?: BlogFootnote[]
  embed?: {
    src: string
    html: string
  }
}

export interface BlogImageBlock extends BlogImage {
  type: 'image'
  order: number
  labels: string[]
  footnotes?: BlogFootnote[]
}

export type BlogContentBlock = BlogTextBlock | BlogImageBlock

export interface BlogDynamicRichTextBlock {
  type: 'rich-text'
  body: string
}

export interface BlogDynamicCodeBlock {
  type: 'code-block'
  language?: string
  code: string
}

export interface BlogDynamicInteractiveEmbedBlock {
  type: 'interactive-embed'
  title?: string
  fullHtml?: string
  html: string
  css?: string
  js?: string
  height?: number
}

export type BlogDynamicBlock =
  | BlogDynamicRichTextBlock
  | BlogDynamicCodeBlock
  | BlogDynamicInteractiveEmbedBlock

export interface BlogPostMeta {
  id: string
  uuid?: string
  slug: string
  title: string
  subtitle?: string
  summary: string
  summaryHtml?: string
  mediaAnchorPrefix?: string
  publishedAt: string | null
  modifiedAt: string | null
  createdAt: string | null
  tags: BlogTag[]
  authors: BlogAuthor[]
  coverImage: BlogImage | null
  ogImage?: BlogImage | null
  isDraft?: boolean
  discourseTopicId?: number
}

export interface BlogArticleDetail extends BlogPostMeta {
  type: 'article'
  readingTime: number
  toc: BlogTocItem[]
  footnotes: BlogFootnote[]
  bodyHtml?: string
  markdownBody?: string
  content?: BlogContentBlock[]
  blocks?: BlogDynamicBlock[]
  relatedArticles: BlogPostMeta[]
  articlesFromSameAuthors: BlogPostMeta[]
  discussion?: BlogDiscussion
}

export interface BlogPodcastShow {
  id: string
  slug: string
  title: string
  description: string
  descriptionText?: string
  logo: BlogImage | null
  hosts: BlogAuthor[]
}

export interface BlogPodcastChannel {
  name: string
  url: string
  data?: {
    duration?: number
    audioFileUrl?: string
  }
}

export interface BlogPodcastDetail extends BlogPostMeta {
  type: 'podcast'
  description: string
  episodeNumber?: number
  showSlug: string
  show?: BlogPodcastShow
  channels: BlogPodcastChannel[]
  credits: BlogContentBlock[]
  creditsHtml?: string
  transcription: Array<{
    html: string
    start?: number
    end?: number
    speaker?: string
  }>
  content?: BlogContentBlock[]
  bodyHtml?: string
  markdownBody?: string
  blocks?: BlogDynamicBlock[]
  relatedEpisodes: BlogPodcastDetail[]
  footnotes: BlogFootnote[]
}

type GraphqlResponse<T> = {
  data?: T
  errors?: Array<{ message?: string }>
}

type GraphqlPostEntity = {
  id?: string
  attributes?: GraphqlPostAttributes
}

type GraphqlPostAttributes = {
  type?: string
  title?: string
  subtitle?: string | null
  summary?: string | null
  slug?: string
  featured?: boolean | null
  episode_number?: number | null
  discourse_topic_id?: number | null
  publish_date?: string | null
  publishedAt?: string | null
  body?: string | null
  markdown_body?: string | null
  credits?: string | null
  html_file?: {
    data?: {
      attributes?: {
        url?: string | null
      }
    } | null
  }
  cover_image?: GraphqlImageRelation
  og_image?: GraphqlImageRelation
  tags?: {
    data?: Array<{
      id?: string
      attributes?: { name?: string | null }
    }>
  }
  authors?: {
    data?: Array<{
      id?: string
      attributes?: { name?: string | null }
    }>
  }
  podcast_show?: {
    data?: {
      id?: string
      attributes?: GraphqlPodcastShowAttributes
    } | null
  }
  channel?: Array<{ channel?: string | null; link?: string | null }> | null
  blocks?: GraphqlDynamicBlock[] | null
  related_posts?: {
    data?: GraphqlPostEntity[]
  }
}

type GraphqlDynamicBlock = {
  __typename?: string
  body?: string | null
  code?: string | null
  language?: string | null
  title?: string | null
  full_html?: string | null
  html?: string | null
  css?: string | null
  js?: string | null
  height?: number | null
}

type GraphqlPodcastShowAttributes = {
  name?: string | null
  slug?: string | null
  description?: string | null
  logo?: GraphqlImageRelation
  hosts?: {
    data?: Array<{
      id?: string
      attributes?: { name?: string | null }
    }>
  }
}

type GraphqlImageRelation = {
  data?: {
    attributes?: {
      url?: string | null
      width?: number | null
      height?: number | null
      caption?: string | null
      alternativeText?: string | null
    }
  } | null
}

type GraphqlPostSlugData = {
  posts?: {
    data?: Array<{
      attributes?: Pick<GraphqlPostAttributes, 'slug' | 'podcast_show'>
    }>
  }
}

type SimplecastEpisodeResponse = {
  duration?: number | null
  ad_free_audio_file_url?: string | null
  audio_file?: {
    url?: string | null
  } | null
}

const truncate = (value: string, limit = BODY_SNIPPET_LIMIT) =>
  value.length > limit
    ? `${value.slice(0, limit)}...(${value.length} chars)`
    : value

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const stringValue = (value: unknown): string =>
  typeof value === 'string' ? value : ''

const optionalStringValue = (value: unknown): string | undefined => {
  const str = stringValue(value).trim()
  return str.length > 0 ? str : undefined
}

const optionalNumberValue = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

export const stripBlogHtml = (value: string): string =>
  decodeHtml(
    value
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )

function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  }

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const key = entity.toLowerCase()
    if (key.startsWith('#x')) {
      const codePoint = Number.parseInt(key.slice(2), 16)
      return Number.isFinite(codePoint)
        ? String.fromCodePoint(codePoint)
        : match
    }
    if (key.startsWith('#')) {
      const codePoint = Number.parseInt(key.slice(1), 10)
      return Number.isFinite(codePoint)
        ? String.fromCodePoint(codePoint)
        : match
    }
    return named[key] ?? match
  })
}

function slugifyText(value: string): string {
  const slug = value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'section'
}

function uniqueSlug(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base)
    return base
  }

  let index = 2
  while (used.has(`${base}-${index}`)) {
    index += 1
  }
  const slug = `${base}-${index}`
  used.add(slug)
  return slug
}

function normaliseSummaryHtml(value: string): string | undefined {
  const html = value.replace(/<section\b[^>]*>[\s\S]*?<\/section>/gi, '').trim()

  return html || undefined
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function replaceYoutubeOembeds(html: string): string {
  return html.replace(
    /<figure\b[^>]*>\s*<oembed\b[^>]*\burl=["']([^"']+)["'][^>]*>\s*<\/oembed>\s*<\/figure>/gi,
    (match, encodedSrc: string) => {
      const src = decodeHtml(encodedSrc)
      const embedUrl = youtubeEmbedUrl(src)
      if (!embedUrl) return match

      return `<div class="media-detail-video-frame"><div class="media-detail-video-aspect"><iframe title="${escapeHtmlAttribute(src)}" src="${escapeHtmlAttribute(embedUrl)}" class="media-detail-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div><figure class="media"></figure>`
    }
  )
}

async function fetchDiscussion(
  topicId: number | undefined
): Promise<BlogDiscussion | undefined> {
  if (!topicId) return undefined

  // A forum outage must not fail the build: the page still links to the
  // forum and the browser refreshes the replies after load.
  try {
    return await fetchDiscourseTopic(topicId, { cache: 'force-cache' })
  } catch (error) {
    logger.warn('Discourse topic unavailable at build time', {
      topicId,
      error,
    })
    return undefined
  }
}

function normaliseArticleHtml(rawHtml: string): {
  html: string
  toc: BlogTocItem[]
  footnotes: BlogFootnote[]
} {
  const usedIds = new Set<string>()
  const footnotes: BlogFootnote[] = []
  const withoutFootnoteContainer = replaceYoutubeOembeds(rawHtml).replace(
    /<section\b[^>]*class=["'][^"']*\bfootnotes-container\b[^"']*["'][\s\S]*?<\/section>/gi,
    ''
  )

  const withFootnoteRefs = withoutFootnoteContainer.replace(
    /<sup\b([^>]*)class=["'][^"']*\bfootnote\b[^"']*["']([^>]*)>[\s\S]*?<\/sup>/gi,
    (match, beforeAttrs, afterAttrs) => {
      const attrs = `${beforeAttrs} ${afterAttrs}`
      const id = /data-id=["']([^"']+)["']/.exec(attrs)?.[1]
      const rawIndex = /data-index=["']([^"']+)["']/.exec(attrs)?.[1]
      const encodedContent = /data-content=["']([^"']*)["']/.exec(attrs)?.[1]
      if (!id || !rawIndex || !encodedContent) return match

      const index = Number.parseInt(rawIndex, 10)
      if (!Number.isFinite(index)) return match

      const valueHTML = decodeHtml(encodedContent)
      const refId = `fntref-${id}`
      const footnoteId = `fnt-${id}`
      footnotes.push({
        id,
        index,
        refId,
        refValue: `[${index}]`,
        valueHTML,
        valueText: stripBlogHtml(valueHTML),
      })

      return `<a class="footnote" href="#${footnoteId}"><sup><span class="anchor" id="${refId}"></span><span>[${index}]</span></sup></a>`
    }
  )

  const toc: BlogTocItem[] = []
  let blockIndex = 0
  const html = withFootnoteRefs.replace(
    /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, level, rawAttrs, innerHtml) => {
      const title = stripBlogHtml(innerHtml)
      if (!title) return match

      const idMatch = /\sid=["']([^"']+)["']/.exec(rawAttrs)
      const id = idMatch?.[1] ?? uniqueSlug(slugifyText(title), usedIds)
      if (idMatch) usedIds.add(id)
      const tag = `h${level}`
      toc.push({
        level: Number.parseInt(level, 10),
        tag,
        href: mediaFragmentHref(id),
        title,
        blockIndex,
      })
      blockIndex += 1

      const attrs = idMatch ? rawAttrs : `${rawAttrs} id="${id}"`
      return `<${tag}${attrs}>${innerHtml}</${tag}>`
    }
  )

  return { html, toc, footnotes }
}

/**
 * Reads a paged listing to the end, stopping on the first short page.
 *
 * Rows are returned raw so the caller can map and filter them afterwards --
 * filtering inside the loop would shorten a full page and end the walk early.
 */
async function collectAllPages<T>(
  fetchPage: (offset: number, pageSize: number) => Promise<T[]>,
  label: string
): Promise<T[]> {
  let collected: T[] = []

  for (let page = 0; page < MAX_SLUG_PAGES; page += 1) {
    const rows = await fetchPage(page * SLUG_PAGE_SIZE, SLUG_PAGE_SIZE)
    collected = [...collected, ...rows]
    if (rows.length < SLUG_PAGE_SIZE) return collected
  }

  throw new Error(
    `${label} still returned full pages after ${MAX_SLUG_PAGES} requests -- pagination is not advancing`
  )
}

/** The CMS sits behind a proxy that now and then drops a connection. */
const CMS_FETCH_ATTEMPTS = 3
const CMS_RETRY_DELAY_MS = 1000
/**
 * The proxy answers a hung CMS with a 504 after 60s, which is also when Next
 * gives up on a static page. Give up well before that.
 */
const CMS_FETCH_TIMEOUT_MS = 20_000

const isTimeout = (error: unknown): boolean =>
  error instanceof Error && error.name === 'TimeoutError'

/**
 * The CMS cannot be reached at all: no key, a dropped or timed out request,
 * or a 5xx from the proxy in front of it. Unlike a GraphQL error or a bad
 * post, this says nothing more will come from the CMS in this build.
 */
export class CmsUnavailableError extends Error {
  override name = 'CmsUnavailableError'
}

/**
 * A post the live CMS listed but that is neither readable from the CMS nor
 * present in the committed snapshot. Only thrown with
 * ALLOW_CONTENT_FETCH_FAILURE=1: listings skip the post and its page renders
 * the 404 page.
 */
export class PressPostUnavailableError extends Error {
  override name = 'PressPostUnavailableError'
}

/**
 * Reads a CMS response, retrying when the connection drops before the body
 * arrives, so one dropped socket does not fail the whole build. HTTP errors
 * and timeouts come back as they are: retrying them would not change the
 * answer, only make the build wait longer.
 */
async function fetchCmsText(
  init: RequestInit,
  label: string
): Promise<{ ok: boolean; status: number; text: string }> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(CMS_PRESS_GRAPHQL_URL, {
        ...init,
        signal: AbortSignal.timeout(CMS_FETCH_TIMEOUT_MS),
      })
      return {
        ok: response.ok,
        status: response.status,
        text: await response.text(),
      }
    } catch (error) {
      if (attempt >= CMS_FETCH_ATTEMPTS || isTimeout(error)) {
        const message = error instanceof Error ? error.message : String(error)
        throw new CmsUnavailableError(
          `${label} CMS request failed: ${message}`,
          {
            cause: error,
          }
        )
      }
      logger.warn(`${label} CMS request dropped, retrying`, {
        attempt,
        error: error instanceof Error ? error.message : String(error),
      })
      await new Promise((resolve) =>
        setTimeout(resolve, CMS_RETRY_DELAY_MS * attempt)
      )
    }
  }
}

async function fetchPressGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
  label: string
): Promise<T> {
  // The blog CMS is the only source of media content: there is no other
  // copy to fall back to once blog.logos.co is gone.
  if (!env.STRAPI_API_KEY) {
    throw new CmsUnavailableError(
      `${label} requires STRAPI_API_KEY to be set (see apps/web/.env.example)`
    )
  }

  const response = await fetchCmsText(
    {
      method: 'POST',
      cache: 'force-cache',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${env.STRAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    },
    label
  )
  const { text } = response
  if (!response.ok) {
    const message = `${label} GraphQL failed: status=${response.status} body=${truncate(text)}`
    throw response.status >= 500
      ? new CmsUnavailableError(message)
      : new Error(message)
  }

  const json = JSON.parse(text) as GraphqlResponse<T>
  if (json.errors && json.errors.length > 0) {
    throw new Error(
      `${label} GraphQL returned errors: ${json.errors.map((error) => error.message).join('; ')}`
    )
  }
  if (!json.data) {
    throw new Error(`${label} GraphQL returned no data`)
  }
  return json.data
}

function extractSimplecastEpisodeId(url: string): string | undefined {
  return /^https:\/\/player\.simplecast\.com\/([^/?]+)(?:[/?]|$)/i.exec(
    url
  )?.[1]
}

async function fetchSimplecastEpisodeData(
  episodeId: string,
  label: string
): Promise<BlogPodcastChannel['data'] | undefined> {
  if (!env.SIMPLECAST_ACCESS_TOKEN) return undefined

  const response = await fetch(
    `https://api.simplecast.com/episodes/${episodeId}`,
    {
      cache: 'force-cache',
      headers: {
        Accept: 'application/json',
        Authorization: env.SIMPLECAST_ACCESS_TOKEN,
      },
    }
  )
  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `${label} Simplecast fetch failed: status=${response.status} body=${truncate(text)}`
    )
  }

  const episode = JSON.parse(text) as SimplecastEpisodeResponse
  const audioFileUrl =
    episode.ad_free_audio_file_url ?? episode.audio_file?.url ?? undefined
  if (!audioFileUrl && !episode.duration) return undefined

  return {
    audioFileUrl,
    duration: episode.duration ?? undefined,
  }
}

async function enrichSimplecastChannels(
  podcast: BlogPodcastDetail
): Promise<BlogPodcastDetail> {
  const channels = await Promise.all(
    podcast.channels.map(async (channel) => {
      if (channel.name !== 'Simplecast') return channel

      const episodeId = extractSimplecastEpisodeId(channel.url)
      if (!episodeId) return channel

      if (!env.SIMPLECAST_ACCESS_TOKEN) {
        if (env.NEXT_PUBLIC_API_MODE === 'production') {
          throw new Error(
            `Podcast ${podcast.slug} Simplecast channel requires SIMPLECAST_ACCESS_TOKEN`
          )
        }
        return channel
      }

      const data = await fetchSimplecastEpisodeData(
        episodeId,
        `Podcast ${podcast.slug}`
      )
      return data ? { ...channel, data } : channel
    })
  )

  return { ...podcast, channels }
}

const channelKey = (name: string) => name.toLowerCase().replace(/[\s_]/g, '')

/**
 * Neither Apple Podcasts nor Spotify is good enough on its own: Apple's iframe
 * embed renders an empty placeholder, and Spotify's only serves a 60 second
 * preview to logged out listeners. Resolve the underlying audio file so the
 * regular audio player can take over and play the whole episode.
 *
 * Only episodes that cannot already be played are resolved, so the common
 * Youtube or Simplecast episode costs no lookup.
 */
async function enrichApplePodcastsChannel(
  podcast: BlogPodcastDetail
): Promise<BlogPodcastDetail> {
  const isPlayable = podcast.channels.some(
    (channel) =>
      channelKey(channel.name) === 'youtube' ||
      Boolean(channel.data?.audioFileUrl)
  )

  if (isPlayable) return podcast

  const applePodcasts = podcast.channels.find(
    (channel) => channelKey(channel.name) === 'applepodcasts'
  )

  if (!applePodcasts) return podcast

  const data = await resolveAudioFromApplePodcasts(
    applePodcasts.url,
    podcast.title
  )

  if (!data) return podcast

  return {
    ...podcast,
    channels: podcast.channels.map((channel) =>
      channel === applePodcasts ? { ...channel, data } : channel
    ),
  }
}

export function resolveAssetUrl(rawUrl?: string | null): string {
  if (!rawUrl) return ''
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl

  return `${CMS_PRESS_ORIGIN}${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`
}

function mapGraphqlImage(image?: GraphqlImageRelation): BlogImage | null {
  const attrs = image?.data?.attributes
  const url = resolveAssetUrl(attrs?.url)
  if (!url) return null

  return {
    url,
    width: attrs?.width ?? 0,
    height: attrs?.height ?? 0,
    caption: attrs?.caption ?? '',
    alt: attrs?.caption ?? attrs?.alternativeText ?? '',
  }
}

function mapGraphqlTags(attrs: GraphqlPostAttributes): BlogTag[] {
  return (
    attrs.tags?.data
      ?.map((tag) => ({
        id: tag.id ?? '',
        name: tag.attributes?.name ?? '',
      }))
      .filter((tag) => tag.name.length > 0) ?? []
  )
}

function mapGraphqlAuthors(attrs: GraphqlPostAttributes): BlogAuthor[] {
  return (
    attrs.authors?.data
      ?.map((author) => ({
        id: author.id ?? '',
        name: author.attributes?.name ?? '',
      }))
      .filter((author) => author.name.length > 0) ?? []
  )
}

function mapGraphqlDynamicBlocks(
  blocks?: GraphqlDynamicBlock[] | null
): BlogDynamicBlock[] | undefined {
  const mapped =
    blocks
      ?.map((block): BlogDynamicBlock | null => {
        if (block.__typename === 'ComponentBlocksRichText') {
          return { type: 'rich-text', body: block.body ?? '' }
        }
        if (block.__typename === 'ComponentBlocksCodeBlock') {
          return {
            type: 'code-block',
            code: block.code ?? '',
            language: block.language ?? undefined,
          }
        }
        if (block.__typename === 'ComponentBlocksInteractiveEmbed') {
          return {
            type: 'interactive-embed',
            title: block.title ?? undefined,
            fullHtml: block.full_html ?? undefined,
            html: block.html ?? '',
            css: block.css ?? undefined,
            js: block.js ?? undefined,
            height: block.height ?? undefined,
          }
        }
        return null
      })
      .filter((block): block is BlogDynamicBlock => block !== null) ?? []

  return mapped.length > 0 ? mapped : undefined
}

function mapGraphqlPostMeta(entity: GraphqlPostEntity): BlogPostMeta {
  const attrs = entity.attributes ?? {}
  const rawSummary = attrs.summary ?? ''
  const summary = stripBlogHtml(rawSummary)
  return {
    id: entity.id ?? '',
    slug: attrs.slug ?? '',
    title: attrs.title ?? '',
    subtitle: attrs.subtitle ?? undefined,
    summary,
    summaryHtml: normaliseSummaryHtml(rawSummary),
    publishedAt: attrs.publish_date ?? attrs.publishedAt ?? null,
    modifiedAt: attrs.publish_date ?? attrs.publishedAt ?? null,
    createdAt: attrs.publish_date ?? attrs.publishedAt ?? null,
    tags: mapGraphqlTags(attrs),
    authors: mapGraphqlAuthors(attrs),
    coverImage: mapGraphqlImage(attrs.cover_image),
    ogImage: mapGraphqlImage(attrs.og_image),
    isDraft: !attrs.publishedAt,
    discourseTopicId: attrs.discourse_topic_id ?? undefined,
  }
}

function estimateReadingTime(value: string): number {
  const text = decodeHtml(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  )
  const words = text.split(/\s+/).filter(Boolean).length
  if (words === 0) return 0
  return Math.max(1, Math.ceil(words / 200))
}

function mapGraphqlArticle(
  entity: GraphqlPostEntity,
  relatedArticles: BlogPostMeta[],
  articlesFromSameAuthors: BlogPostMeta[]
): BlogArticleDetail {
  const attrs = entity.attributes ?? {}
  const rawBody = attrs.body ?? ''
  const articleHtml = rawBody ? normaliseArticleHtml(rawBody) : undefined

  return {
    ...mapGraphqlPostMeta(entity),
    type: 'article',
    readingTime: estimateReadingTime(
      articleHtml?.html || attrs.markdown_body || ''
    ),
    toc: articleHtml?.toc ?? [],
    footnotes: articleHtml?.footnotes ?? [],
    bodyHtml: articleHtml?.html,
    markdownBody: attrs.markdown_body ?? undefined,
    blocks: mapGraphqlDynamicBlocks(attrs.blocks),
    relatedArticles,
    articlesFromSameAuthors,
    discussion: undefined,
  }
}

function mapGraphqlShow(
  show?: GraphqlPostAttributes['podcast_show']
): BlogPodcastShow | undefined {
  const data = show?.data
  if (!data) return undefined
  const attrs = data.attributes ?? {}
  const description = attrs.description ?? ''
  return {
    id: data.id ?? '',
    slug: attrs.slug ?? DEFAULT_PODCAST_SHOW_SLUG,
    title: attrs.name ?? 'Logos Podcast',
    description,
    descriptionText: stripBlogHtml(description),
    logo: mapGraphqlImage(attrs.logo),
    hosts:
      attrs.hosts?.data
        ?.map((host) => ({
          id: host.id ?? '',
          name: host.attributes?.name ?? '',
        }))
        .filter((host) => host.name.length > 0) ?? [],
  }
}

function mapGraphqlPodcast(
  entity: GraphqlPostEntity,
  relatedEpisodes: BlogPodcastDetail[] = []
): BlogPodcastDetail {
  const attrs = entity.attributes ?? {}
  const meta = mapGraphqlPostMeta(entity)
  const show = mapGraphqlShow(attrs.podcast_show)
  const rawBody = attrs.body ?? ''
  const articleHtml = rawBody ? normaliseArticleHtml(rawBody) : undefined
  const description = stripBlogHtml(attrs.summary ?? '')

  return {
    ...meta,
    type: 'podcast',
    description,
    episodeNumber: attrs.episode_number ?? undefined,
    showSlug: show?.slug ?? DEFAULT_PODCAST_SHOW_SLUG,
    show,
    channels:
      attrs.channel
        ?.map((channel) => ({
          name: channel.channel ?? '',
          url: channel.link ?? '',
        }))
        .filter(
          (channel) => channel.name.length > 0 && channel.url.length > 0
        ) ?? [],
    credits: [],
    creditsHtml: attrs.credits
      ? normaliseArticleHtml(attrs.credits).html
      : undefined,
    transcription: [],
    content: undefined,
    bodyHtml: articleHtml?.html,
    markdownBody: attrs.markdown_body ?? undefined,
    blocks: mapGraphqlDynamicBlocks(attrs.blocks),
    relatedEpisodes,
    footnotes: articleHtml?.footnotes ?? [],
  }
}

const POST_SLUGS_QUERY = `
  query PostSlugs($type: String!, $start: Int!, $limit: Int!) {
    posts(
      filters: { type: { eq: $type } }
      pagination: { start: $start, limit: $limit }
      sort: ["publish_date:desc"]
      publicationState: LIVE
    ) {
      data {
        attributes {
          slug
          podcast_show {
            data {
              attributes {
                slug
              }
            }
          }
        }
      }
    }
  }
`

async function getStrapiArticleSlugs(): Promise<string[]> {
  const posts = await collectAllPages(async (start, limit) => {
    const data = await fetchPressGraphql<GraphqlPostSlugData>(
      POST_SLUGS_QUERY,
      { type: 'Article', start, limit },
      'Article slugs'
    )
    return data.posts?.data ?? []
  }, 'Article slugs')

  return [
    ...new Set([
      ...posts.map((post) => post.attributes?.slug ?? '').filter(Boolean),
      ...getPressPreviewSlugs(),
    ]),
  ]
}

async function getStrapiPodcastPaths(): Promise<
  Array<{ showSlug: string; slug: string }>
> {
  const posts = await collectAllPages(async (start, limit) => {
    const data = await fetchPressGraphql<GraphqlPostSlugData>(
      POST_SLUGS_QUERY,
      { type: 'Episode', start, limit },
      'Podcast slugs'
    )
    return data.posts?.data ?? []
  }, 'Podcast slugs')

  return posts
    .map((post) => ({
      showSlug:
        post.attributes?.podcast_show?.data?.attributes?.slug ??
        DEFAULT_PODCAST_SHOW_SLUG,
      slug: post.attributes?.slug ?? '',
    }))
    .filter((path) => path.slug.length > 0)
}

/**
 * Set once the CMS proved unreachable with ALLOW_CONTENT_FETCH_FAILURE=1. The
 * rest of this process then reads the committed snapshot straight away
 * instead of waiting on a dead CMS once per post. Other errors fall back for
 * the failed read only.
 */
let cmsUnavailable = false
/** Set once any read in this process came from the committed snapshot. */
let usedFallback = false

/**
 * Reads live CMS content. A failure fails the build, unless
 * ALLOW_CONTENT_FETCH_FAILURE=1, in which case the committed snapshot
 * answers instead. A post the snapshot lacks (newer than it, or a staging
 * draft) throws PressPostUnavailableError.
 */
async function fromCmsOrFallback<T>(
  label: string,
  readCms: () => Promise<T>,
  readFallback: (snapshot: PressSnapshot) => T | undefined
): Promise<T> {
  if (!cmsUnavailable) {
    try {
      return await readCms()
    } catch (error) {
      allowContentFetchFailure(`Blog CMS (${label})`, error)
      if (error instanceof CmsUnavailableError) cmsUnavailable = true
    }
  }
  usedFallback = true

  const value = readFallback(await getFallbackPressSnapshot())
  if (value === undefined) {
    throw new PressPostUnavailableError(
      `${label} is missing from the committed press snapshot ${FALLBACK_PRESS_SNAPSHOT_PATH}`
    )
  }
  return value
}

const articleSlugs = (snapshot: PressSnapshot): string[] =>
  snapshot.articles.map((article) => article.slug)

const podcastPaths = (
  snapshot: PressSnapshot
): Array<{ showSlug: string; slug: string }> =>
  snapshot.podcasts.map(({ showSlug, slug }) => ({ showSlug, slug }))

const findArticle = (
  snapshot: PressSnapshot,
  slug: string
): BlogArticleDetail | undefined =>
  snapshot.articles.find((article) => article.slug === slug)

const findPodcast = (
  snapshot: PressSnapshot,
  showSlug: string,
  slug: string
): BlogPodcastDetail | undefined =>
  snapshot.podcasts.find(
    (podcast) => podcast.slug === slug && podcast.showSlug === showSlug
  )

/**
 * True once this process gave up on an unreachable CMS and switched to the
 * committed snapshot (ALLOW_CONTENT_FETCH_FAILURE=1).
 */
export function isCmsUnavailable(): boolean {
  return cmsUnavailable
}

/** True when this process read media from a snapshot instead of the CMS. */
export async function isUsingPressSnapshot(): Promise<boolean> {
  return usedFallback || (await getPressSnapshot()) !== null
}

export async function getBlogArticleSlugs(): Promise<string[]> {
  const snapshot = await getPressSnapshot()
  const slugs = snapshot
    ? articleSlugs(snapshot)
    : await fromCmsOrFallback(
        'Article slugs',
        getStrapiArticleSlugs,
        articleSlugs
      )
  return slugs.filter((slug) => keepSafeSlug('article', slug))
}

export async function getBlogPodcastPaths(): Promise<
  Array<{ showSlug: string; slug: string }>
> {
  const snapshot = await getPressSnapshot()
  const paths = snapshot
    ? podcastPaths(snapshot)
    : await fromCmsOrFallback(
        'Podcast slugs',
        getStrapiPodcastPaths,
        podcastPaths
      )
  return paths.filter(
    (path) =>
      keepSafeSlug('podcast', path.slug) &&
      keepSafeSlug('podcast show', path.showSlug)
  )
}

export async function getBlogPodcastShowSlugs(): Promise<string[]> {
  const paths = await getBlogPodcastPaths()
  return [...new Set(paths.map((path) => path.showSlug))].sort((a, b) =>
    a.localeCompare(b)
  )
}

const ARTICLE_DETAIL_QUERY = `
  query ArticleDetail($slug: String!, $publicationState: PublicationState!) {
    posts(
      filters: { and: [{ slug: { eq: $slug } }, { type: { eq: "Article" } }] }
      pagination: { limit: 1 }
      publicationState: $publicationState
    ) {
      data {
        id
        attributes {
          type
          title
          subtitle
          summary
          slug
          featured
          discourse_topic_id
          publish_date
          publishedAt
          body
          markdown_body
          cover_image {
            data {
              attributes {
                url
                width
                height
                caption
                alternativeText
              }
            }
          }
          og_image {
            data {
              attributes {
                url
                width
                height
                caption
                alternativeText
              }
            }
          }
          tags {
            data {
              id
              attributes {
                name
              }
            }
          }
          authors {
            data {
              id
              attributes {
                name
              }
            }
          }
          blocks {
            __typename
            ... on ComponentBlocksRichText {
              body
            }
            ... on ComponentBlocksCodeBlock {
              language
              code
            }
            ... on ComponentBlocksInteractiveEmbed {
              title
              full_html
              html
              css
              js
              height
            }
          }
          html_file {
            data {
              attributes {
                url
              }
            }
          }
          related_posts(publicationState: LIVE, filters: { type: { eq: "Article" } }) {
            data {
              id
              attributes {
                type
                title
                subtitle
                summary
                slug
                publish_date
                publishedAt
                cover_image {
                  data {
                    attributes {
                      url
                      width
                      height
                      caption
                      alternativeText
                    }
                  }
                }
                tags {
                  data {
                    id
                    attributes {
                      name
                    }
                  }
                }
                authors {
                  data {
                    id
                    attributes {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

const SAME_AUTHOR_ARTICLES_QUERY = `
  query SameAuthorArticles($authorIds: [ID], $postId: ID) {
    sameAuthorPosts: posts(
      filters: {
        and: [
          { authors: { id: { in: $authorIds } } }
          { type: { eq: "Article" } }
          { id: { ne: $postId } }
        ]
      }
      pagination: { limit: 10 }
      sort: ["publish_date:desc"]
      publicationState: LIVE
    ) {
      data {
        id
        attributes {
          type
          title
          subtitle
          summary
          slug
          publish_date
          publishedAt
          cover_image {
            data {
              attributes {
                url
                width
                height
                caption
                alternativeText
              }
            }
          }
          tags {
            data {
              id
              attributes {
                name
              }
            }
          }
          authors {
            data {
              id
              attributes {
                name
              }
            }
          }
        }
      }
    }
  }
`

async function getStrapiArticle(slug: string): Promise<BlogArticleDetail> {
  type Data = {
    posts?: { data?: GraphqlPostEntity[] }
  }
  type SameAuthorData = {
    sameAuthorPosts?: { data?: GraphqlPostEntity[] }
  }

  const data = await fetchPressGraphql<Data>(
    ARTICLE_DETAIL_QUERY,
    {
      slug,
      publicationState: getPressPreviewSlugs().includes(slug)
        ? 'PREVIEW'
        : 'LIVE',
    },
    'Article detail'
  )
  const post = data.posts?.data?.[0]
  if (!post) throw new Error(`Article not found: ${slug}`)

  const authorIds =
    post.attributes?.authors?.data?.map((author) => author.id ?? '') ?? []
  const sameAuthorData =
    authorIds.length > 0
      ? await fetchPressGraphql<SameAuthorData>(
          SAME_AUTHOR_ARTICLES_QUERY,
          { authorIds, postId: post.id ?? '' },
          'Same-author articles'
        )
      : undefined
  const relatedArticles =
    post.attributes?.related_posts?.data?.map(mapGraphqlPostMeta) ?? []
  const articlesFromSameAuthors =
    sameAuthorData?.sameAuthorPosts?.data?.map(mapGraphqlPostMeta) ?? []

  const article = mapGraphqlArticle(
    post,
    relatedArticles,
    articlesFromSameAuthors
  )
  const htmlFileUrl = post.attributes?.html_file?.data?.attributes?.url
  if (htmlFileUrl) {
    const fullHtml = await fetchPressHtmlFile(
      htmlFileUrl,
      `Article ${slug} HTML document`
    )

    article.bodyHtml = undefined
    article.blocks = [
      {
        type: 'interactive-embed',
        title: article.title,
        fullHtml,
        html: '',
      },
    ]
    article.readingTime = estimateReadingTime(fullHtml)
  }
  article.discussion = await fetchDiscussion(article.discourseTopicId)
  return sanitiseMediaArticle(article)
}

const PODCAST_DETAIL_QUERY = `
  query PodcastDetail($slug: String!, $showSlug: String!) {
    posts(
      filters: {
        and: [
          { slug: { eq: $slug } }
          { type: { eq: "Episode" } }
          { podcast_show: { slug: { eq: $showSlug } } }
        ]
      }
      pagination: { limit: 1 }
      publicationState: LIVE
    ) {
      data {
        id
        attributes {
          type
          title
          subtitle
          summary
          slug
          featured
          episode_number
          discourse_topic_id
          publish_date
          publishedAt
          body
          markdown_body
          credits
          channel {
            channel
            link
          }
          podcast_show {
            data {
              id
              attributes {
                name
                slug
                description
                hosts {
                  data {
                    id
                    attributes {
                      name
                    }
                  }
                }
                logo {
                  data {
                    attributes {
                      url
                      width
                      height
                      caption
                      alternativeText
                    }
                  }
                }
              }
            }
          }
          cover_image {
            data {
              attributes {
                url
                width
                height
                caption
                alternativeText
              }
            }
          }
          og_image {
            data {
              attributes {
                url
                width
                height
                caption
                alternativeText
              }
            }
          }
          tags {
            data {
              id
              attributes {
                name
              }
            }
          }
          authors {
            data {
              id
              attributes {
                name
              }
            }
          }
          blocks {
            __typename
            ... on ComponentBlocksRichText {
              body
            }
            ... on ComponentBlocksCodeBlock {
              language
              code
            }
            ... on ComponentBlocksInteractiveEmbed {
              title
              full_html
              html
              css
              js
              height
            }
          }
          related_posts(publicationState: LIVE, filters: { type: { eq: "Episode" } }) {
            data {
              id
              attributes {
                type
                title
                subtitle
                summary
                slug
                episode_number
                publish_date
                publishedAt
                podcast_show {
                  data {
                    id
                    attributes {
                      name
                      slug
                      description
                      logo {
                        data {
                          attributes {
                            url
                            width
                            height
                            caption
                            alternativeText
                          }
                        }
                      }
                    }
                  }
                }
                cover_image {
                  data {
                    attributes {
                      url
                      width
                      height
                      caption
                      alternativeText
                    }
                  }
                }
                tags {
                  data {
                    id
                    attributes {
                      name
                    }
                  }
                }
                authors {
                  data {
                    id
                    attributes {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

async function getStrapiPodcast(
  showSlug: string,
  slug: string
): Promise<BlogPodcastDetail> {
  type Data = {
    posts?: { data?: GraphqlPostEntity[] }
  }
  const data = await fetchPressGraphql<Data>(
    PODCAST_DETAIL_QUERY,
    { slug, showSlug },
    'Podcast detail'
  )
  const post = data.posts?.data?.[0]
  if (!post) throw new Error(`Podcast not found: ${showSlug}/${slug}`)

  const relatedEpisodes =
    post.attributes?.related_posts?.data?.map((entity) =>
      mapGraphqlPodcast(entity)
    ) ?? []

  return enrichApplePodcastsChannel(
    await enrichSimplecastChannels(
      sanitiseMediaPodcast(mapGraphqlPodcast(post, relatedEpisodes))
    )
  )
}

export async function getBlogArticleDetail(
  slug: string
): Promise<BlogArticleDetail> {
  const snapshot = await getPressSnapshot()
  if (snapshot) {
    const article = snapshot.articles.find((item) => item.slug === slug)
    if (!article)
      throw new Error(`Article absent from reviewed preview: ${slug}`)
    return article
  }
  return fromCmsOrFallback(
    `Article ${slug}`,
    () => getStrapiArticle(slug),
    (fallback) => findArticle(fallback, slug)
  )
}

export async function getBlogPodcastDetail(
  showSlug: string,
  slug: string
): Promise<BlogPodcastDetail> {
  const snapshot = await getPressSnapshot()
  if (snapshot) {
    const podcast = snapshot.podcasts.find(
      (item) => item.slug === slug && item.showSlug === showSlug
    )
    if (!podcast)
      throw new Error(
        `Podcast absent from reviewed preview: ${showSlug}/${slug}`
      )
    return podcast
  }
  return fromCmsOrFallback(
    `Podcast ${showSlug}/${slug}`,
    () => getStrapiPodcast(showSlug, slug),
    (fallback) => findPodcast(fallback, showSlug, slug)
  )
}

/** Live posts with a publish date: drafts render (noindex) but are never listed. */
export const isPublishedPost = (
  post: Pick<BlogPostMeta, 'isDraft' | 'publishedAt'>
): boolean => !post.isDraft && Boolean(post.publishedAt)

/** Every article, newest first as the CMS returns them. */
/** Drops a post that is unavailable during an outage, see PressPostUnavailableError. */
const skipUnavailable = <T>(error: unknown): T | null => {
  if (error instanceof PressPostUnavailableError) return null
  throw error
}

const isPresent = <T>(value: T | null): value is T => value !== null

export const getAllBlogArticles = cache(
  async (): Promise<BlogArticleDetail[]> => {
    const slugs = await getBlogArticleSlugs()
    const articles = await mapWithConcurrency(
      slugs,
      DETAIL_FETCH_CONCURRENCY,
      (slug) =>
        getBlogArticleDetail(slug).catch(skipUnavailable<BlogArticleDetail>)
    )
    return articles.filter(isPresent)
  }
)

/** Every podcast episode, newest first as the CMS returns them. */
export const getAllBlogPodcasts = cache(
  async (): Promise<BlogPodcastDetail[]> => {
    const paths = await getBlogPodcastPaths()
    const podcasts = await mapWithConcurrency(
      paths,
      DETAIL_FETCH_CONCURRENCY,
      (path) =>
        getBlogPodcastDetail(path.showSlug, path.slug).catch(
          skipUnavailable<BlogPodcastDetail>
        )
    )
    return podcasts.filter(isPresent)
  }
)
