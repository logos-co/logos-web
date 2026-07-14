import { cache } from 'react'

import { ROUTES } from '@/constants/routes'
import {
  getBlogArticleDetail,
  getBlogArticleSlugs,
  getBlogPodcastDetail,
  getBlogPodcastPaths,
  stripBlogHtml,
  type BlogContentBlock,
  type BlogDynamicBlock,
  type BlogPostMeta,
} from '@/lib/blog-content'
import type { MediaSearchEntry } from '@/lib/media-search'

const BUILD_CONCURRENCY = 8
const MAX_SEARCH_TERMS = 4_000
const RESULT_DESCRIPTION_LIMIT = 320

const compact = (value: string) => value.replace(/\s+/g, ' ').trim()

const htmlText = (value?: string) =>
  value
    ? stripBlogHtml(
        value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      )
    : ''

const contentText = (content?: readonly BlogContentBlock[]) =>
  content
    ?.map((block) =>
      block.type === 'text'
        ? block.text || htmlText(block.html)
        : [block.alt, block.caption].filter(Boolean).join(' ')
    )
    .join(' ') ?? ''

const dynamicBlockText = (block: BlogDynamicBlock) => {
  if (block.type === 'rich-text') return htmlText(block.body)
  if (block.type === 'code-block') return block.code
  return [block.title, htmlText(block.fullHtml), htmlText(block.html)]
    .filter(Boolean)
    .join(' ')
}

const dynamicBlocksText = (blocks?: readonly BlogDynamicBlock[]) =>
  blocks?.map(dynamicBlockText).join(' ') ?? ''

const metaText = (post: BlogPostMeta) =>
  [
    post.subtitle,
    ...post.authors.map((author) => author.name),
    ...post.tags.map((tag) => tag.name),
  ]
    .filter(Boolean)
    .join(' ')

const resultDescription = (value: string) => {
  const description = compact(value)
  return description.length > RESULT_DESCRIPTION_LIMIT
    ? `${description.slice(0, RESULT_DESCRIPTION_LIMIT).trimEnd()}…`
    : description
}

const indexSearchText = (value: string) =>
  [
    ...new Set(
      compact(value)
        .normalize('NFKD')
        .toLocaleLowerCase()
        .replace(/\p{M}/gu, '')
        .match(/[\p{L}\p{N}]+/gu) ?? []
    ),
  ]
    .slice(0, MAX_SEARCH_TERMS)
    .join(' ')

async function mapInBatches<T, R>(
  items: readonly T[],
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  let results: R[] = []

  for (let index = 0; index < items.length; index += BUILD_CONCURRENCY) {
    const batch = await Promise.all(
      items.slice(index, index + BUILD_CONCURRENCY).map(mapper)
    )
    results = [...results, ...batch]
  }

  return results
}

async function buildMediaSearchIndex(): Promise<MediaSearchEntry[]> {
  const [articleSlugs, podcastPaths] = await Promise.all([
    getBlogArticleSlugs(),
    getBlogPodcastPaths(),
  ])

  const [articles, podcasts] = await Promise.all([
    mapInBatches(articleSlugs, async (slug): Promise<MediaSearchEntry> => {
      const article = await getBlogArticleDetail(slug)
      return {
        type: 'article',
        title: article.title,
        description: resultDescription(article.subtitle || article.summary),
        publishedAt: article.publishedAt,
        href: ROUTES.mediaArticle(article.slug),
        searchText: indexSearchText(
          [
            metaText(article),
            article.summary,
            htmlText(article.bodyHtml),
            article.markdownBody,
            contentText(article.content),
            dynamicBlocksText(article.blocks),
          ]
            .filter(Boolean)
            .join(' ')
        ),
      }
    }),
    mapInBatches(podcastPaths, async (path): Promise<MediaSearchEntry> => {
      const podcast = await getBlogPodcastDetail(path.showSlug, path.slug)
      return {
        type: 'podcast',
        title: podcast.title,
        description: resultDescription(podcast.description || podcast.summary),
        publishedAt: podcast.publishedAt,
        href: ROUTES.mediaPodcast(podcast.showSlug, podcast.slug),
        searchText: indexSearchText(
          [
            metaText(podcast),
            podcast.summary,
            podcast.show?.title,
            podcast.show?.descriptionText,
            htmlText(podcast.bodyHtml),
            podcast.markdownBody,
            contentText(podcast.content),
            contentText(podcast.credits),
            dynamicBlocksText(podcast.blocks),
            ...podcast.transcription.map((part) =>
              [part.speaker, htmlText(part.html)].filter(Boolean).join(' ')
            ),
          ]
            .filter(Boolean)
            .join(' ')
        ),
      }
    }),
  ])

  return [...articles, ...podcasts].filter(
    (entry) => entry.title.trim().length > 0 && entry.href.trim().length > 0
  )
}

export const getMediaSearchIndex = cache(buildMediaSearchIndex)
