import { env } from '@/lib/env'
import { BLOG_DEPLOYMENT_ORIGIN, BLOG_ORIGIN } from '@/lib/blog-engine'
import { youtubeEmbedUrl } from '@/lib/media-embed'
import { resolveAudioFromApplePodcasts } from '@/lib/podcast-feed'
import { EXTERNAL_URLS } from '@/constants/routes'

export const DEFAULT_PODCAST_SHOW_SLUG = 'logos-state'

const BLOG_SEARCH_LIMIT = 100
const CMS_PRESS_ORIGIN = 'https://cms-press.logos.co'
const FORUM_ORIGIN = EXTERNAL_URLS.forum.replace(/\/$/, '')
const BODY_SNIPPET_LIMIT = 200

export interface BlogTag {
  id: string
  name: string
}

export interface BlogAuthor {
  id: string
  name: string
  emailAddress?: string
}

export interface BlogImage {
  url: string
  alt: string
  width: number
  height: number
  caption?: string
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

export interface BlogDiscussionPost {
  id: string
  avatarUrl: string
  createdAt: string
  displayName: string
  html: string
}

export interface BlogDiscussion {
  id: number
  posts: BlogDiscussionPost[]
  postsCount: number
  slug: string
  title: string
  url: string
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

type FetchResult<T> = { ok: true; data: T } | { ok: false; error: Error }

type BlogSearchResponse = {
  data?: {
    posts?: Array<{
      type?: 'article' | 'podcast'
      data?: {
        slug?: string
      }
    }>
  }
}

type LegacyArticlePageProps = {
  data?: {
    data?: unknown
    relatedArticles?: unknown[]
    articlesFromSameAuthors?: unknown[]
  }
}

type LegacyPodcastPageProps = {
  episode?: unknown
  relatedEpisodes?: unknown[]
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
      attributes?: { name?: string | null; email_address?: string | null }
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
      attributes?: { name?: string | null; email_address?: string | null }
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

function addTargetBlank(html: string) {
  return html.replace(
    /<a\b(?![^>]*\btarget=)([^>]*?)>/gi,
    '<a target="_blank" rel="noopener noreferrer"$1>'
  )
}

function normaliseSummaryHtml(value: string): string | undefined {
  const html = value.replace(/<section\b[^>]*>[\s\S]*?<\/section>/gi, '').trim()

  return html ? addTargetBlank(html) : undefined
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

  try {
    const response = await fetch(`${FORUM_ORIGIN}/t/${topicId}.json`, {
      cache: 'force-cache',
    })
    if (!response.ok) return undefined

    const topic = (await response.json()) as unknown
    if (!isRecord(topic)) return undefined

    const slug = stringValue(topic.slug)
    const title = stringValue(topic.title)
    const stream = isRecord(topic.post_stream) ? topic.post_stream : {}
    const rawPosts = Array.isArray(stream.posts) ? stream.posts : []
    const posts = rawPosts
      .slice(1, 4)
      .filter(isRecord)
      .map((post): BlogDiscussionPost | null => {
        const id = post.id
        const username = stringValue(post.username)
        const avatarTemplate = stringValue(post.avatar_template)
        const createdAt = stringValue(post.created_at)
        const html = stringValue(post.cooked)
        if (!id || !username || !avatarTemplate || !createdAt || !html) {
          return null
        }

        const avatarPath = avatarTemplate.replace('{size}', '40')
        const avatarUrl = avatarPath.startsWith('http')
          ? avatarPath
          : `${FORUM_ORIGIN}${avatarPath}`
        const linkedHtml = addTargetBlank(
          html.replace(/href="\/u\//g, `href="${FORUM_ORIGIN}/u/`)
        )

        return {
          id: String(id),
          avatarUrl,
          createdAt,
          displayName: stringValue(post.display_username) || username,
          html: linkedHtml,
        }
      })
      .filter((post): post is BlogDiscussionPost => post !== null)
    const rawPostsCount = optionalNumberValue(topic.posts_count) ?? 1

    return {
      id: topicId,
      posts,
      postsCount: Math.max(0, rawPostsCount - 1),
      slug,
      title,
      url: `${FORUM_ORIGIN}/t/${slug}/${topicId}`,
    }
  } catch {
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
  const html = addTargetBlank(withFootnoteRefs).replace(
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
        href: `#${id}`,
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

async function tryFetchText(
  url: string,
  init: RequestInit,
  label: string
): Promise<FetchResult<string>> {
  try {
    const response = await fetch(url, init)
    const text = await response.text()
    if (!response.ok) {
      return {
        ok: false,
        error: new Error(
          `${label} failed: status=${response.status} url=${url} body=${truncate(text)}`
        ),
      }
    }
    return { ok: true, data: text }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, error: new Error(`${label} fetch threw: ${message}`) }
  }
}

async function fetchJson<T>(url: string, label: string): Promise<T> {
  const result = await tryFetchText(
    url,
    {
      cache: 'force-cache',
      headers: { Accept: 'application/json' },
    },
    label
  )
  if (!result.ok) throw result.error

  try {
    return JSON.parse(result.data) as T
  } catch {
    throw new Error(
      `${label} returned non-JSON: url=${url} body=${truncate(result.data)}`
    )
  }
}

async function fetchLegacyPageProps<T>(
  path: string,
  label: string
): Promise<T> {
  for (const origin of [BLOG_ORIGIN, BLOG_DEPLOYMENT_ORIGIN]) {
    const url = `${origin}${path}`
    const result = await tryFetchText(
      url,
      {
        cache: 'force-cache',
      },
      label
    )
    if (!result.ok) continue

    const match = result.data.match(
      /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
    )
    if (!match) continue

    const page = JSON.parse(match[1]) as {
      props?: {
        pageProps?: T
      }
    }
    if (page.props?.pageProps) return page.props.pageProps
  }

  throw new Error(`${label} missing pageProps: path=${path}`)
}

function hasStrapiConfig() {
  return Boolean(env.STRAPI_GRAPHQL_URL && env.STRAPI_API_KEY)
}

function shouldAllowLegacyFallback() {
  return env.CI || env.NEXT_PUBLIC_API_MODE !== 'production'
}

async function fetchPressGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
  label: string
): Promise<T> {
  if (!env.STRAPI_GRAPHQL_URL || !env.STRAPI_API_KEY) {
    throw new Error(
      `${label} requires STRAPI_GRAPHQL_URL and STRAPI_API_KEY to be set`
    )
  }

  const response = await fetch(env.STRAPI_GRAPHQL_URL, {
    method: 'POST',
    cache: 'force-cache',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${env.STRAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `${label} GraphQL failed: status=${response.status} body=${truncate(text)}`
    )
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

function resolveAssetUrl(rawUrl?: string | null): string {
  if (!rawUrl) return ''
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl

  const base =
    env.NEXT_PUBLIC_ASSETS_BASE_URL ??
    env.STRAPI_API_URL?.replace(/\/api\/?$/, '') ??
    CMS_PRESS_ORIGIN
  return `${base.replace(/\/+$/, '')}${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`
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
        emailAddress: author.attributes?.email_address ?? undefined,
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
          emailAddress: host.attributes?.email_address ?? undefined,
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

function mapLegacyImage(value: unknown): BlogImage | null {
  if (!isRecord(value)) return null
  const url = optionalStringValue(value.url)
  if (!url) return null
  return {
    url,
    alt: stringValue(value.alt),
    width: optionalNumberValue(value.width) ?? 0,
    height: optionalNumberValue(value.height) ?? 0,
    caption: optionalStringValue(value.caption),
  }
}

function mapLegacyTags(value: unknown): BlogTag[] {
  if (!Array.isArray(value)) return []
  return value
    .map((tag): BlogTag | null => {
      if (!isRecord(tag)) return null
      const name = stringValue(tag.name)
      if (!name) return null
      return {
        id: stringValue(tag.id),
        name,
      }
    })
    .filter((tag): tag is BlogTag => tag !== null)
}

function mapLegacyAuthors(value: unknown): BlogAuthor[] {
  if (!Array.isArray(value)) return []
  return value
    .map((author): BlogAuthor | null => {
      if (!isRecord(author)) return null
      const name = stringValue(author.name)
      if (!name) return null
      return {
        id: stringValue(author.id),
        name,
        emailAddress: optionalStringValue(author.emailAddress),
      }
    })
    .filter((author): author is BlogAuthor => author !== null)
}

function mapLegacyContentBlocks(value: unknown): BlogContentBlock[] {
  if (!Array.isArray(value)) return []
  return value
    .map((block): BlogContentBlock | null => {
      if (!isRecord(block)) return null
      if (block.type === 'image') {
        const image = mapLegacyImage(block)
        if (!image) return null
        return {
          ...image,
          type: 'image',
          order: optionalNumberValue(block.order) ?? 0,
          labels: Array.isArray(block.labels) ? block.labels.map(String) : [],
        }
      }
      if (block.type === 'text') {
        return {
          type: 'text',
          id: optionalStringValue(block.id),
          order: optionalNumberValue(block.order) ?? 0,
          tagName: stringValue(block.tagName) || 'p',
          html: stringValue(block.html),
          text: stringValue(block.text),
          labels: Array.isArray(block.labels) ? block.labels.map(String) : [],
          classNames: Array.isArray(block.classNames)
            ? block.classNames.map(String)
            : [],
          footnotes: Array.isArray(block.footnotes)
            ? (block.footnotes as BlogFootnote[])
            : [],
          embed: isRecord(block.embed)
            ? {
                src: stringValue(block.embed.src),
                html: stringValue(block.embed.html),
              }
            : undefined,
        }
      }
      return null
    })
    .filter((block): block is BlogContentBlock => block !== null)
}

function mapLegacyDynamicBlocks(
  value: unknown
): BlogDynamicBlock[] | undefined {
  if (!Array.isArray(value)) return undefined
  const blocks = value
    .filter(isRecord)
    .map((block) => block as unknown as BlogDynamicBlock)
  return blocks.length > 0 ? blocks : undefined
}

function htmlAttribute(name: string, value: unknown): string {
  const text = stringValue(value)
  if (!text) return ''
  return ` ${name}="${escapeHtmlAttribute(text)}"`
}

function serialiseLegacyHtmlDocument(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined

  const bodyHtml = stringValue(value.bodyHtml)
  if (!bodyHtml.trim()) return undefined

  const metas = Array.isArray(value.metas)
    ? value.metas
        .filter(isRecord)
        .map((meta) => {
          if (stringValue(meta.charset)) {
            return `<meta charset="${escapeHtmlAttribute(stringValue(meta.charset))}">`
          }

          const attrs = [
            htmlAttribute('name', meta.name),
            htmlAttribute('content', meta.content),
            htmlAttribute('property', meta.property),
            htmlAttribute('http-equiv', meta.httpEquiv),
          ].join('')
          return attrs ? `<meta${attrs}>` : ''
        })
        .filter(Boolean)
        .join('')
    : ''
  const links = Array.isArray(value.links)
    ? value.links
        .filter(isRecord)
        .map((link) => {
          const attrs = [
            htmlAttribute('rel', link.rel),
            htmlAttribute('href', link.href),
            htmlAttribute('as', link.as),
            htmlAttribute('type', link.type),
            htmlAttribute('crossorigin', link.crossOrigin),
          ].join('')
          return attrs ? `<link${attrs}>` : ''
        })
        .filter(Boolean)
        .join('')
    : ''
  const styles = Array.isArray(value.styles)
    ? value.styles
        .map((style) => `<style>${stringValue(style)}</style>`)
        .join('')
    : ''
  const scripts = Array.isArray(value.scripts)
    ? value.scripts
        .filter(isRecord)
        .map((script) => {
          const attrs = [
            htmlAttribute('src', script.src),
            htmlAttribute('type', script.type),
            script.async ? ' async' : '',
            script.defer ? ' defer' : '',
            script.noModule ? ' nomodule' : '',
          ].join('')
          return `<script${attrs}>${stringValue(script.content)}</script>`
        })
        .join('')
    : ''
  const title = stringValue(value.title)
  const bodyClass = htmlAttribute('class', value.bodyClass)

  return `<!doctype html><html><head>${title ? `<title>${title}</title>` : ''}${metas}${links}${styles}</head><body${bodyClass}>${bodyHtml}${scripts}</body></html>`
}

function mapLegacyToc(value: unknown): BlogTocItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!isRecord(item)) return null
      return {
        level: optionalNumberValue(item.level) ?? 0,
        tag: stringValue(item.tag),
        href: stringValue(item.href),
        title: stringValue(item.title),
        blockIndex: optionalNumberValue(item.blockIndex) ?? 0,
      }
    })
    .filter((item): item is BlogTocItem => Boolean(item?.title && item.href))
}

function mapLegacyPostMeta(value: unknown): BlogPostMeta {
  const post = isRecord(value) ? value : {}
  const rawSummary = stringValue(post.summary)
  return {
    id: stringValue(post.id),
    uuid: optionalStringValue(post.uuid),
    slug: stringValue(post.slug),
    title: stringValue(post.title),
    subtitle: optionalStringValue(post.subtitle),
    summary: stripBlogHtml(rawSummary),
    summaryHtml: normaliseSummaryHtml(rawSummary),
    publishedAt: optionalStringValue(post.publishedAt) ?? null,
    modifiedAt: optionalStringValue(post.modifiedAt) ?? null,
    createdAt: optionalStringValue(post.createdAt) ?? null,
    tags: mapLegacyTags(post.tags),
    authors: mapLegacyAuthors(post.authors),
    coverImage: mapLegacyImage(post.coverImage),
    ogImage: mapLegacyImage(post.ogImage),
    isDraft: Boolean(post.isDraft),
    discourseTopicId: optionalNumberValue(post.discourse_topic_id),
  }
}

function mapLegacyArticle(value: unknown): BlogArticleDetail {
  const post = isRecord(value) ? value : {}
  const content = mapLegacyContentBlocks(post.content)
  const htmlDocument = serialiseLegacyHtmlDocument(post.htmlDocument)
  return {
    ...mapLegacyPostMeta(post),
    type: 'article',
    readingTime: optionalNumberValue(post.readingTime) ?? 1,
    toc: mapLegacyToc(post.toc),
    footnotes: content.flatMap((block) => block.footnotes ?? []),
    content,
    blocks: htmlDocument
      ? [
          {
            type: 'interactive-embed',
            title: stringValue(post.title),
            fullHtml: htmlDocument,
            html: '',
          },
        ]
      : mapLegacyDynamicBlocks(post.blocks),
    relatedArticles: [],
    articlesFromSameAuthors: [],
    discussion: undefined,
  }
}

function mapLegacyPodcast(value: unknown): BlogPodcastDetail {
  const post = isRecord(value) ? value : {}
  const show = isRecord(post.show)
    ? {
        id: stringValue(post.show.id),
        slug: stringValue(post.show.slug) || DEFAULT_PODCAST_SHOW_SLUG,
        title: stringValue(post.show.title) || 'Logos Podcast',
        description: stringValue(post.show.description),
        descriptionText: optionalStringValue(post.show.descriptionText),
        logo: mapLegacyImage(post.show.logo),
        hosts: mapLegacyAuthors(post.show.hosts),
      }
    : undefined
  const content = mapLegacyContentBlocks(post.content)

  return {
    ...mapLegacyPostMeta(post),
    type: 'podcast',
    description: stripBlogHtml(
      stringValue(post.description) || stringValue(post.summary)
    ),
    summaryHtml: normaliseSummaryHtml(
      stringValue(post.summary) || stringValue(post.description)
    ),
    episodeNumber: optionalNumberValue(post.episodeNumber),
    showSlug: show?.slug ?? DEFAULT_PODCAST_SHOW_SLUG,
    show,
    channels: Array.isArray(post.channels)
      ? post.channels
          .filter(isRecord)
          .map((channel) => ({
            name: stringValue(channel.name),
            url: stringValue(channel.url),
            data: isRecord(channel.data)
              ? {
                  duration: optionalNumberValue(channel.data.duration),
                  audioFileUrl: optionalStringValue(channel.data.audioFileUrl),
                }
              : undefined,
          }))
          .filter((channel) => channel.name && channel.url)
      : [],
    credits: mapLegacyContentBlocks(post.credits),
    creditsHtml: undefined,
    transcription: Array.isArray(post.transcription)
      ? (post.transcription as BlogPodcastDetail['transcription'])
      : [],
    content,
    blocks: mapLegacyDynamicBlocks(post.blocks),
    relatedEpisodes: [],
    footnotes: content.flatMap((block) => block.footnotes ?? []),
  }
}

const POST_SLUGS_QUERY = `
  query PostSlugs($type: String!) {
    posts(
      filters: { type: { eq: $type } }
      pagination: { limit: 100 }
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
  const data = await fetchPressGraphql<GraphqlPostSlugData>(
    POST_SLUGS_QUERY,
    { type: 'Article' },
    'Article slugs'
  )

  return (
    data.posts?.data
      ?.map((post) => post.attributes?.slug ?? '')
      .filter(Boolean) ?? []
  )
}

async function getLegacyArticleSlugs(): Promise<string[]> {
  const params = new URLSearchParams({
    type: 'article',
    limit: String(BLOG_SEARCH_LIMIT),
  })
  const json = await fetchJson<BlogSearchResponse>(
    `${BLOG_ORIGIN}/api/search?${params.toString()}`,
    'Blog article search'
  )
  return (
    json.data?.posts
      ?.filter((post) => post.type === 'article')
      .map((post) => post.data?.slug ?? '')
      .filter(Boolean) ?? []
  )
}

async function getStrapiPodcastPaths(): Promise<
  Array<{ showSlug: string; slug: string }>
> {
  const data = await fetchPressGraphql<GraphqlPostSlugData>(
    POST_SLUGS_QUERY,
    { type: 'Episode' },
    'Podcast slugs'
  )

  return (
    data.posts?.data
      ?.map((post) => ({
        showSlug:
          post.attributes?.podcast_show?.data?.attributes?.slug ??
          DEFAULT_PODCAST_SHOW_SLUG,
        slug: post.attributes?.slug ?? '',
      }))
      .filter((path) => path.slug.length > 0) ?? []
  )
}

export async function getBlogArticleSlugs(): Promise<string[]> {
  if (hasStrapiConfig()) {
    try {
      return await getStrapiArticleSlugs()
    } catch (error) {
      if (!shouldAllowLegacyFallback()) throw error
    }
  }
  if (!shouldAllowLegacyFallback() && !hasStrapiConfig()) {
    throw new Error('Blog article slugs require Strapi env in production')
  }
  return getLegacyArticleSlugs()
}

async function getLegacyPodcastPaths(): Promise<
  Array<{ showSlug: string; slug: string }>
> {
  const params = new URLSearchParams({
    type: 'podcast',
    limit: String(BLOG_SEARCH_LIMIT),
  })
  const json = await fetchJson<BlogSearchResponse>(
    `${BLOG_ORIGIN}/api/search?${params.toString()}`,
    'Blog podcast search'
  )
  return (
    json.data?.posts
      ?.filter((post) => post.type === 'podcast')
      .map((post) => ({
        showSlug: DEFAULT_PODCAST_SHOW_SLUG,
        slug: post.data?.slug ?? '',
      }))
      .filter((path) => path.slug.length > 0) ?? []
  )
}

export async function getBlogPodcastPaths(): Promise<
  Array<{ showSlug: string; slug: string }>
> {
  if (hasStrapiConfig()) {
    try {
      return await getStrapiPodcastPaths()
    } catch (error) {
      if (!shouldAllowLegacyFallback()) throw error
    }
  }
  if (!shouldAllowLegacyFallback() && !hasStrapiConfig()) {
    throw new Error('Blog podcast slugs require Strapi env in production')
  }
  return getLegacyPodcastPaths()
}

export async function getBlogPodcastShowSlugs(): Promise<string[]> {
  const paths = await getBlogPodcastPaths()
  return [...new Set(paths.map((path) => path.showSlug))].sort((a, b) =>
    a.localeCompare(b)
  )
}

const ARTICLE_DETAIL_QUERY = `
  query ArticleDetail($slug: String!) {
    posts(
      filters: { and: [{ slug: { eq: $slug } }, { type: { eq: "Article" } }] }
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
                email_address
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
                      email_address
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
                email_address
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
    { slug },
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
    const result = await tryFetchText(
      resolveAssetUrl(htmlFileUrl),
      { cache: 'force-cache' },
      `Article ${slug} HTML document`
    )
    if (!result.ok) throw result.error

    article.bodyHtml = undefined
    article.blocks = [
      {
        type: 'interactive-embed',
        title: article.title,
        fullHtml: result.data,
        html: '',
      },
    ]
    article.readingTime = estimateReadingTime(result.data)
  }
  article.discussion = await fetchDiscussion(article.discourseTopicId)
  return article
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
                      email_address
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
                email_address
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
                      email_address
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
    await enrichSimplecastChannels(mapGraphqlPodcast(post, relatedEpisodes))
  )
}

async function getLegacyArticle(slug: string): Promise<BlogArticleDetail> {
  const pageProps = await fetchLegacyPageProps<LegacyArticlePageProps>(
    `/article/${slug}`,
    'Legacy article page'
  )
  const article = mapLegacyArticle(pageProps.data?.data)
  article.relatedArticles =
    pageProps.data?.relatedArticles?.map(mapLegacyPostMeta) ?? []
  article.articlesFromSameAuthors =
    pageProps.data?.articlesFromSameAuthors?.map(mapLegacyPostMeta) ?? []
  article.discussion = await fetchDiscussion(article.discourseTopicId)
  return article
}

async function getLegacyPodcast(
  showSlug: string,
  slug: string
): Promise<BlogPodcastDetail> {
  const pageProps = await fetchLegacyPageProps<LegacyPodcastPageProps>(
    `/podcasts/${showSlug}/${slug}`,
    'Legacy podcast page'
  )
  const podcast = mapLegacyPodcast(pageProps.episode)
  podcast.relatedEpisodes =
    pageProps.relatedEpisodes?.map(mapLegacyPodcast) ?? []
  // Which source the episode came from must not decide whether it has a
  // player, so the legacy payload gets the same treatment as the Strapi one.
  return enrichApplePodcastsChannel(podcast)
}

export async function getBlogArticleDetail(
  slug: string
): Promise<BlogArticleDetail> {
  if (hasStrapiConfig()) {
    try {
      return await getStrapiArticle(slug)
    } catch (error) {
      if (!shouldAllowLegacyFallback()) throw error
    }
  }
  if (!shouldAllowLegacyFallback() && !hasStrapiConfig()) {
    throw new Error('Blog article detail requires Strapi env in production')
  }
  return getLegacyArticle(slug)
}

export async function getBlogPodcastDetail(
  showSlug: string,
  slug: string
): Promise<BlogPodcastDetail> {
  if (hasStrapiConfig()) {
    try {
      return await getStrapiPodcast(showSlug, slug)
    } catch (error) {
      if (!shouldAllowLegacyFallback()) throw error
    }
  }
  if (!shouldAllowLegacyFallback() && !hasStrapiConfig()) {
    throw new Error('Blog podcast detail requires Strapi env in production')
  }
  return getLegacyPodcast(showSlug, slug)
}
