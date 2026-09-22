import { ROUTES } from '@/constants/routes'
import type { BlogArticleDetail, BlogPodcastDetail } from '@/lib/blog-content'

type FeedPost = BlogArticleDetail | BlogPodcastDetail

interface RssDocumentInput {
  title: string
  description: string
  posts: ReadonlyArray<FeedPost>
}

const SITE_ORIGIN = 'https://logos.co'
const MEDIA_URL = `${SITE_ORIGIN}${ROUTES.media}`

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const postUrl = (post: FeedPost): string =>
  `${SITE_ORIGIN}${
    post.type === 'article'
      ? ROUTES.mediaArticle(post.slug)
      : ROUTES.mediaPodcast(post.showSlug, post.slug)
  }`

const postSummary = (post: FeedPost): string =>
  post.type === 'article' ? post.summary : post.description

/**
 * blog.logos.co used the CMS post id as a non-permalink guid. Readers dedupe
 * on the guid, so keeping it stops every post resurfacing as unread once the
 * old feed URLs redirect here.
 */
function rssGuid(post: FeedPost, url: string): string {
  return post.id
    ? `<guid isPermaLink="false">${escapeXml(post.id)}</guid>`
    : `<guid isPermaLink="true">${escapeXml(url)}</guid>`
}

function rssItem(post: FeedPost): string {
  const url = postUrl(post)
  const audioUrl =
    post.type === 'podcast'
      ? post.channels.find((channel) => channel.data?.audioFileUrl)?.data
          ?.audioFileUrl
      : undefined
  const pubDate = post.publishedAt
    ? `<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`
    : ''
  const enclosure = audioUrl
    ? `<enclosure url="${escapeXml(audioUrl)}" type="audio/mpeg" />`
    : ''

  return `<item><title>${escapeXml(post.title)}</title><link>${escapeXml(url)}</link>${rssGuid(post, url)}<description>${escapeXml(postSummary(post))}</description>${pubDate}${enclosure}</item>`
}

export function buildRssDocument({
  title,
  description,
  posts,
}: RssDocumentInput): string {
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(title)}</title><link>${MEDIA_URL}</link><description>${escapeXml(description)}</description><language>en</language>${posts.map(rssItem).join('')}</channel></rss>`
}

/**
 * Atom requires full RFC 3339 timestamps, but the CMS stores some modified
 * dates as a bare `YYYY-MM-DD`.
 */
const atomTimestamp = (post: FeedPost | undefined): string | null => {
  const value = post?.modifiedAt ?? post?.publishedAt
  return value ? new Date(value).toISOString() : null
}

/** Expects posts newest first; the first one dates the whole feed. */
export function buildAtomDocument(posts: ReadonlyArray<FeedPost>): string {
  const updated = atomTimestamp(posts[0]) ?? new Date(0).toISOString()
  const entries = posts
    .map((post) => {
      const url = postUrl(post)
      return `<entry><id>${escapeXml(url)}</id><title>${escapeXml(post.title)}</title><link href="${escapeXml(url)}"/><updated>${atomTimestamp(post) ?? updated}</updated><summary>${escapeXml(postSummary(post))}</summary></entry>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><id>${MEDIA_URL}</id><title>Logos Media</title><link href="${MEDIA_URL}"/><updated>${updated}</updated>${entries}</feed>`
}
