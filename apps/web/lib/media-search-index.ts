import { ROUTES } from '@/constants/routes'
import {
  isPublishedPost,
  stripBlogHtml,
  type BlogArticleDetail,
  type BlogPodcastDetail,
} from '@/lib/blog-content'
import { optimizeMediaImage, type MediaImageManifest } from '@/lib/media-images'
import type { MediaSearchDocument } from '@/lib/media-search'

/**
 * Build-time only: turns the CMS posts into the documents lib/media-search
 * indexes in the browser. Written by scripts/generate-media-assets.ts.
 */

/**
 * Whole articles, so a word deep in the text is found as it was on the old
 * blog. The cap only trims the longest podcast transcripts (up to 100k chars),
 * which would otherwise dominate the index.
 */
export const MEDIA_SEARCH_BODY_LIMIT = 40_000

/** Show notes run to thousands of words; results show a short excerpt. */
export const MEDIA_SEARCH_DESCRIPTION_LIMIT = 200

type MediaPost = BlogArticleDetail | BlogPodcastDetail

function excerpt(text: string, limit: number): string {
  if (text.length <= limit) return text
  const cut = text.slice(0, limit + 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : limit).trimEnd()}…`
}

function bodyText(post: MediaPost): string {
  const html = [
    post.bodyHtml ?? '',
    ...(post.content ?? []).map((block) =>
      block.type === 'text' ? block.html : ''
    ),
    ...(post.blocks ?? []).map((block) =>
      block.type === 'rich-text' ? block.body : ''
    ),
  ].join(' ')
  return stripBlogHtml(html).slice(0, MEDIA_SEARCH_BODY_LIMIT)
}

function description(post: MediaPost): string {
  const text =
    post.type === 'article'
      ? post.subtitle || post.summary
      : stripBlogHtml(post.description || post.summary)
  return excerpt(text, MEDIA_SEARCH_DESCRIPTION_LIMIT)
}

function toDocument(
  post: MediaPost,
  manifest: MediaImageManifest,
  basePath: string
): MediaSearchDocument {
  const image = optimizeMediaImage(post.coverImage, manifest, basePath)
  return {
    id: `${post.type}:${post.slug}`,
    type: post.type,
    slug: post.slug,
    title: post.title,
    description: description(post),
    body: bodyText(post),
    tags: post.tags.map((tag) => tag.name),
    authors: post.authors.map((author) => author.name),
    publishedAt: post.publishedAt,
    href:
      post.type === 'article'
        ? ROUTES.mediaArticle(post.slug)
        : ROUTES.mediaPodcast(post.showSlug, post.slug),
    image: image ? { url: image.url, alt: image.alt || post.title } : null,
  }
}

export function buildMediaSearchDocuments(
  posts: ReadonlyArray<MediaPost>,
  manifest: MediaImageManifest,
  basePath = ''
): MediaSearchDocument[] {
  return posts
    .filter(isPublishedPost)
    .map((post) => toDocument(post, manifest, basePath))
}
