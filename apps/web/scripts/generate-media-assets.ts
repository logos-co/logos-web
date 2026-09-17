import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  getBlogArticleDetail,
  getBlogArticleSlugs,
  getBlogPodcastDetail,
  getBlogPodcastPaths,
  getBlogPodcastShowSlugs,
  type BlogArticleDetail,
  type BlogPodcastDetail,
} from '../lib/blog-content'
import {
  MEDIA_IMAGE_CACHE_DIR,
  MEDIA_IMAGE_MANIFEST_PATH,
  MEDIA_IMAGE_OUTPUT_DIR,
} from '../lib/media-image-manifest'
import { buildMediaImages } from '../lib/media-image-variants'
import { collectMediaImageUrls } from '../lib/media-images'
import {
  buildAtomDocument,
  buildRssDocument,
  isFeedXml,
} from '../lib/media-feeds'

/**
 * Reads every media post once, then writes what the static export needs next
 * to the pages: the RSS and Atom feeds, and resized copies of the images the
 * detail pages show.
 */

const outputRoot = path.resolve(process.cwd(), 'public')
const LEGACY_BLOG_ORIGIN = 'https://blog.logos.co'

type MediaPost = BlogArticleDetail | BlogPodcastDetail

const publishedTime = (post: MediaPost): number =>
  post.publishedAt ? Date.parse(post.publishedAt) : 0

const newestFirst = <T extends MediaPost>(posts: T[]): T[] =>
  [...posts].sort((a, b) => publishedTime(b) - publishedTime(a))

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

async function showFeed(
  showSlug: string,
  episodes: BlogPodcastDetail[]
): Promise<string | null> {
  if (episodes.length === 0) return legacyFeed(showSlug)

  const show = episodes.find((episode) => episode.show)?.show
  const title = show?.title || showSlug
  return buildRssDocument({
    title,
    description: show?.descriptionText || `${title} podcast episodes`,
    posts: episodes,
  })
}

async function writeMediaFeeds(
  articles: BlogArticleDetail[],
  podcasts: BlogPodcastDetail[],
  showSlugs: string[]
): Promise<void> {
  const publishedArticles = articles.filter(
    (article) => !article.isDraft && article.publishedAt
  )
  const publishedPodcasts = podcasts.filter(
    (podcast) => !podcast.isDraft && podcast.publishedAt
  )
  const allPosts = newestFirst([...publishedArticles, ...publishedPodcasts])

  // One feed per show the CMS knows about, so a new show does not leave its
  // subscribers on a redirect to a missing file. A show with no published
  // episodes falls back to mirroring whatever the legacy blog still serves.
  const showFeeds = await Promise.all(
    showSlugs.map(async (showSlug) => ({
      showSlug,
      body: await showFeed(
        showSlug,
        newestFirst(
          publishedPodcasts.filter((podcast) => podcast.showSlug === showSlug)
        )
      ),
    }))
  )
  for (const { showSlug, body } of showFeeds) {
    if (body) continue
    console.warn(
      `Skipping public/rss/${showSlug}.xml -- the show has no published episodes and no usable legacy feed`
    )
  }

  const rssDir = path.join(outputRoot, 'rss')
  await mkdir(rssDir, { recursive: true })
  // blog.logos.co/rss/main.xml only ever carried articles; episodes have their
  // own show feeds. Keep it that way so the redirect changes nothing for
  // existing subscribers.
  const articlesRss = buildRssDocument({
    title: 'Logos Media',
    description: 'Articles from Logos',
    posts: newestFirst(publishedArticles),
  })
  const allPostsRss = buildRssDocument({
    title: 'Logos Media',
    description: 'Articles and podcasts from Logos',
    posts: allPosts,
  })
  const atom = buildAtomDocument(allPosts)

  await Promise.all([
    writeFile(path.join(rssDir, 'main.xml'), articlesRss),
    ...showFeeds.flatMap(({ showSlug, body }) =>
      body ? [writeFile(path.join(rssDir, `${showSlug}.xml`), body)] : []
    ),
    writeFile(path.join(outputRoot, 'rss.xml'), allPostsRss),
    writeFile(path.join(outputRoot, 'atom.xml'), atom),
    writeFile(path.join(outputRoot, 'atom_page2.xml'), atom),
  ])
}

async function writeMediaImages(posts: MediaPost[]): Promise<void> {
  const startedAt = Date.now()
  const urls = [...new Set(posts.flatMap(collectMediaImageUrls))]
  const { manifest, failures, skipped } = await buildMediaImages({
    urls,
    cacheDir: MEDIA_IMAGE_CACHE_DIR,
    outputDir: MEDIA_IMAGE_OUTPUT_DIR,
  })

  await mkdir(path.dirname(MEDIA_IMAGE_MANIFEST_PATH), { recursive: true })
  await writeFile(MEDIA_IMAGE_MANIFEST_PATH, JSON.stringify(manifest))

  // A failed download only costs speed: the page keeps the CMS URL.
  for (const failure of failures) {
    console.warn(
      `Media image stays on the CMS: ${failure.reason} url=${failure.url}`
    )
  }
  const seconds = Math.round((Date.now() - startedAt) / 1000)
  console.log(
    `Media images: ${Object.keys(manifest).length} resized, ${skipped.length} vector or animated, ${failures.length} failed (${seconds}s)`
  )
}

async function main(): Promise<void> {
  const [articleSlugs, podcastPaths, showSlugs] = await Promise.all([
    getBlogArticleSlugs(),
    getBlogPodcastPaths(),
    getBlogPodcastShowSlugs(),
  ])
  const [articles, podcasts] = await Promise.all([
    Promise.all(articleSlugs.map((slug) => getBlogArticleDetail(slug))),
    Promise.all(
      podcastPaths.map(({ showSlug, slug }) =>
        getBlogPodcastDetail(showSlug, slug)
      )
    ),
  ])

  // Drafts get pages too (noindex), so their images are resized as well.
  await Promise.all([
    writeMediaFeeds(articles, podcasts, showSlugs),
    writeMediaImages([...articles, ...podcasts]),
  ])
}

await main()
