import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  getBlogArticleDetail,
  getBlogArticleSlugs,
  getBlogPodcastDetail,
  getBlogPodcastPaths,
  type BlogArticleDetail,
  type BlogPodcastDetail,
} from '../lib/blog-content'
import { isFeedXml } from '../lib/media-feeds'

const SITE_ORIGIN = 'https://logos.co'
const outputRoot = path.resolve(process.cwd(), 'public')
const LEGACY_BLOG_ORIGIN = 'https://blog.logos.co'

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const publishedTime = (post: BlogArticleDetail | BlogPodcastDetail): number =>
  post.publishedAt ? Date.parse(post.publishedAt) : 0

const articleUrl = (post: BlogArticleDetail): string =>
  `${SITE_ORIGIN}/media/article/${post.slug}`

const podcastUrl = (post: BlogPodcastDetail): string =>
  `${SITE_ORIGIN}/media/podcasts/${post.showSlug}/${post.slug}`

function rssItem(post: BlogArticleDetail | BlogPodcastDetail): string {
  const url = post.type === 'article' ? articleUrl(post) : podcastUrl(post)
  const description = post.type === 'article' ? post.summary : post.description
  const audioUrl =
    post.type === 'podcast'
      ? post.channels.find((channel) => channel.data?.audioFileUrl)?.data
          ?.audioFileUrl
      : undefined
  return `<item><title>${escapeXml(post.title)}</title><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid><description>${escapeXml(description)}</description>${post.publishedAt ? `<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>` : ''}${audioUrl ? `<enclosure url="${escapeXml(audioUrl)}" type="audio/mpeg" />` : ''}</item>`
}

function rssDocument(
  title: string,
  description: string,
  posts: Array<BlogArticleDetail | BlogPodcastDetail>
): string {
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(title)}</title><link>${SITE_ORIGIN}/media</link><description>${escapeXml(description)}</description><language>en</language>${posts.map(rssItem).join('')}</channel></rss>`
}

function atomDocument(
  posts: Array<BlogArticleDetail | BlogPodcastDetail>
): string {
  const updated =
    posts[0]?.modifiedAt ?? posts[0]?.publishedAt ?? new Date(0).toISOString()
  const entries = posts
    .map((post) => {
      const url = post.type === 'article' ? articleUrl(post) : podcastUrl(post)
      const summary = post.type === 'article' ? post.summary : post.description
      return `<entry><id>${escapeXml(url)}</id><title>${escapeXml(post.title)}</title><link href="${escapeXml(url)}"/><updated>${escapeXml(post.modifiedAt ?? post.publishedAt ?? updated)}</updated><summary>${escapeXml(summary)}</summary></entry>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><id>${SITE_ORIGIN}/media</id><title>Logos Media</title><link href="${SITE_ORIGIN}/media"/><updated>${escapeXml(updated)}</updated>${entries}</feed>`
}

/**
 * Mirrors a show's legacy feed, or reports that there is nothing to mirror.
 *
 * A missing legacy feed is not a build failure -- the show simply has no
 * subscribers to carry over -- but a non-feed response must never be written,
 * so both cases return null and say why.
 */
async function legacyFeed(showSlug: string): Promise<string | null> {
  const url = `${LEGACY_BLOG_ORIGIN}/rss/${showSlug}.xml`
  const response = await fetch(url)
  if (!response.ok) {
    console.warn(
      `Legacy ${showSlug} feed answered ${response.status}: url=${url}`
    )
    return null
  }

  const body = await response.text()
  if (!isFeedXml(body)) {
    console.warn(
      `Legacy ${showSlug} feed is not XML, ignoring it: url=${url} content-type=${response.headers.get('content-type') ?? 'unknown'}`
    )
    return null
  }

  return body
}

async function main(): Promise<void> {
  const [articleSlugs, podcastPaths] = await Promise.all([
    getBlogArticleSlugs(),
    getBlogPodcastPaths(),
  ])
  const [articles, podcasts] = await Promise.all([
    Promise.all(articleSlugs.map((slug) => getBlogArticleDetail(slug))),
    Promise.all(
      podcastPaths.map(({ showSlug, slug }) =>
        getBlogPodcastDetail(showSlug, slug)
      )
    ),
  ])
  const publishedArticles = articles.filter(
    (article) => !article.isDraft && article.publishedAt
  )
  const publishedPodcasts = podcasts.filter(
    (podcast) => !podcast.isDraft && podcast.publishedAt
  )
  const allPosts = [...publishedArticles, ...publishedPodcasts].sort(
    (a, b) => publishedTime(b) - publishedTime(a)
  )
  const logosState = publishedPodcasts.filter(
    (podcast) => podcast.showSlug === 'logos-state'
  )
  const hashingItOut = publishedPodcasts.filter(
    (podcast) => podcast.showSlug === 'hashing-it-out'
  )
  const hashingItOutRss =
    hashingItOut.length > 0
      ? rssDocument(
          'Hashing It Out',
          'Hashing It Out podcast episodes',
          hashingItOut
        )
      : await legacyFeed('hashing-it-out')

  const rssDir = path.join(outputRoot, 'rss')
  await mkdir(rssDir, { recursive: true })
  const mainRss = rssDocument(
    'Logos Media',
    'Articles and podcasts from Logos',
    allPosts
  )
  const atom = atomDocument(allPosts)
  if (!hashingItOutRss) {
    console.warn(
      'Skipping public/rss/hashing-it-out.xml -- the show has no published episodes and no usable legacy feed'
    )
  }

  await Promise.all([
    writeFile(path.join(rssDir, 'main.xml'), mainRss),
    writeFile(
      path.join(rssDir, 'logos-state.xml'),
      rssDocument('Logos Podcast', 'The Logos Podcast', logosState)
    ),
    ...(hashingItOutRss
      ? [writeFile(path.join(rssDir, 'hashing-it-out.xml'), hashingItOutRss)]
      : []),
    writeFile(path.join(outputRoot, 'rss.xml'), mainRss),
    writeFile(path.join(outputRoot, 'atom.xml'), atom),
    writeFile(path.join(outputRoot, 'atom_page2.xml'), atom),
  ])
}

await main()
