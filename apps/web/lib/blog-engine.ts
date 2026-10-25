import { ROUTES } from '@/constants/routes'
import {
  getAllBlogArticles,
  getAllBlogPodcasts,
  isPublishedPost,
  type BlogArticleDetail,
  type BlogPodcastDetail,
  type BlogPostMeta,
} from '@/lib/blog-content'

export type BlogArticleRow = {
  title: string
  titleSerif?: string
  date: string
  galleryDate: string
  author: string
  description: string
  /** Default card image for backwards-compatible consumers. */
  image: string
  thumbnailImage: string
  galleryImage: string
  cardImage: string
  featuredImage: string
  href: string
  readingTime: number
}

export interface BlogArticleListingRow extends BlogArticleRow {
  summary: string
}

export type BlogPodcastRow = {
  title: string
  image: string
  description: string
  date: string
  episodeNumber?: number
  href: string
}

const stripHtml = (value: string): string =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

const formatLongDate = (iso?: string | null) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

const formatGalleryDate = (iso?: string | null) => {
  if (!iso) return ''
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso))
  return `${parts.find((p) => p.type === 'month')?.value ?? ''}.${parts.find((p) => p.type === 'day')?.value ?? ''}.${parts.find((p) => p.type === 'year')?.value ?? ''}`
}

const inferSerifPrefix = (title: string) => {
  const colonIndex = title.indexOf(':')
  if (colonIndex === -1 || colonIndex > 28) return undefined
  return title.slice(0, colonIndex + 1)
}

const hasImage = <T extends { image: string }>(item: T) =>
  item.image.trim().length > 0

type BlogImageVariant = 'thumbnail' | 'small' | 'large' | 'original'

const PRESS_IMAGE_VARIANT_PREFIXES = [
  'thumbnail_',
  'small_',
  'medium_',
  'large_',
] as const

const blogImageVariantPrefix = (variant: BlogImageVariant) =>
  variant === 'original' ? '' : `${variant}_`

const getBlogImageVariantUrl = (
  imageUrl: string,
  variant: BlogImageVariant
) => {
  if (!imageUrl) return ''

  try {
    const url = new URL(imageUrl)
    const slashIndex = url.pathname.lastIndexOf('/')
    if (slashIndex === -1) return imageUrl

    const directory = url.pathname.slice(0, slashIndex + 1)
    const fileName = url.pathname.slice(slashIndex + 1)
    const baseFileName =
      PRESS_IMAGE_VARIANT_PREFIXES.find((prefix) =>
        fileName.startsWith(prefix)
      ) !== undefined
        ? fileName.replace(/^(thumbnail_|small_|medium_|large_)/, '')
        : fileName

    url.pathname = `${directory}${blogImageVariantPrefix(variant)}${baseFileName}`
    return url.toString()
  } catch {
    return imageUrl
  }
}

export const repeatToLength = <T>(items: T[], length: number): T[] =>
  Array.from({ length }, (_, index) => items[index % items.length])

const publishedTime = (post: BlogPostMeta): number =>
  post.publishedAt ? Date.parse(post.publishedAt) : 0

const newestPublished = <T extends BlogPostMeta>(posts: T[]): T[] =>
  posts
    .filter(isPublishedPost)
    .sort((a, b) => publishedTime(b) - publishedTime(a))

const hasTag = (post: BlogPostMeta, tag: string): boolean =>
  post.tags.some((item) => item.name.toLowerCase() === tag.toLowerCase())

const toArticleRow = (article: BlogArticleDetail): BlogArticleRow => {
  const coverImage = article.coverImage?.url ?? ''
  const featuredImage = getBlogImageVariantUrl(coverImage, 'original')

  return {
    title: article.title,
    titleSerif: inferSerifPrefix(article.title),
    date: formatLongDate(article.publishedAt),
    galleryDate: formatGalleryDate(article.publishedAt),
    author: article.authors.map((author) => author.name).join(', ') || 'Logos',
    description: stripHtml(article.subtitle || article.summary || ''),
    image: featuredImage,
    thumbnailImage: getBlogImageVariantUrl(coverImage, 'thumbnail'),
    galleryImage: getBlogImageVariantUrl(coverImage, 'small'),
    cardImage: featuredImage,
    featuredImage,
    href: ROUTES.mediaArticle(article.slug),
    readingTime: article.readingTime > 0 ? article.readingTime : 1,
  }
}

const toPodcastRow = (podcast: BlogPodcastDetail): BlogPodcastRow => ({
  title: podcast.title,
  image: podcast.coverImage?.url ?? '',
  description: stripHtml(podcast.description || podcast.summary || ''),
  date: formatLongDate(podcast.publishedAt),
  episodeNumber: podcast.episodeNumber ?? undefined,
  href: ROUTES.mediaPodcast(podcast.showSlug, podcast.slug),
})

/**
 * Article cards across the site (home, technology stack, media). Reads the
 * same CMS data the article pages are built from, so every card links to a
 * page that exists.
 */
export const getLatestBlogArticles = async (
  limit = 4,
  tag?: string
): Promise<BlogArticleRow[]> =>
  newestPublished(await getAllBlogArticles())
    .filter((article) => !tag || hasTag(article, tag))
    .map(toArticleRow)
    .filter(hasImage)
    .slice(0, limit)

export const getBlogArticleListing = async (): Promise<
  BlogArticleListingRow[]
> =>
  newestPublished(await getAllBlogArticles()).map((article) => ({
    ...toArticleRow(article),
    summary: stripHtml(article.summary),
  }))

export const getLatestBlogPodcasts = async (
  limit = 20
): Promise<BlogPodcastRow[]> =>
  newestPublished(await getAllBlogPodcasts())
    .map(toPodcastRow)
    .filter(hasImage)
    .slice(0, limit)

export const getBlogPageData = async () => {
  const [articles, podcasts] = await Promise.all([
    getAllBlogArticles(),
    getLatestBlogPodcasts(),
  ])

  return {
    articles: newestPublished(articles).map(toArticleRow).filter(hasImage),
    podcasts,
  }
}
