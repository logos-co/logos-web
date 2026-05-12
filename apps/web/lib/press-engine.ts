export const PRESS_ORIGIN = 'https://press.logos.co'

const PRESS_SEARCH_API = `${PRESS_ORIGIN}/api/search`

export type PressArticleRow = {
  title: string
  titleSerif?: string
  date: string
  galleryDate: string
  author: string
  description: string
  image: string
  href: string
  readingTime: number
}

export type PressPodcastRow = {
  title: string
  image: string
  description: string
  date: string
  episodeNumber?: number
  href: string
}

type PressSearchPost = {
  data: {
    title: string
    subtitle?: string | null
    slug: string
    publishedAt?: string | null
    coverImage?: {
      url?: string | null
      alt?: string | null
    } | null
    summary?: string | null
    description?: string | null
    readingTime?: number | null
    authors?: { name: string }[]
  }
  type: 'article' | 'podcast'
}

type PressSearchResponse = {
  data?: {
    posts?: PressSearchPost[]
  }
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

export const repeatToLength = <T>(items: T[], length: number): T[] =>
  Array.from({ length }, (_, index) => items[index % items.length])

const getPressSearchItems = async (
  type: 'article' | 'podcast',
  limit: number
): Promise<PressSearchPost[]> => {
  const url = `${PRESS_SEARCH_API}?type=${type}&limit=${limit}`
  const response = await fetch(url, { cache: 'force-cache' })
  if (!response.ok) {
    throw new Error(`Press search failed: ${response.status} ${url}`)
  }
  const json = (await response.json()) as PressSearchResponse
  return json.data?.posts?.filter((post) => post.type === type) ?? []
}

const toArticleRow = (post: PressSearchPost): PressArticleRow => {
  const data = post.data
  const author = data.authors?.map((item) => item.name).join(', ') || 'Logos'
  const description = stripHtml(data.subtitle || data.summary || '')

  return {
    title: data.title,
    titleSerif: inferSerifPrefix(data.title),
    date: formatLongDate(data.publishedAt),
    galleryDate: formatGalleryDate(data.publishedAt),
    author,
    description,
    image: data.coverImage?.url || '',
    href: `${PRESS_ORIGIN}/article/${data.slug}`,
    readingTime: data.readingTime || 1,
  }
}

const toPodcastRow = (post: PressSearchPost): PressPodcastRow => {
  const data = post.data

  return {
    title: data.title,
    image: data.coverImage?.url || '',
    description: stripHtml(data.description || data.summary || ''),
    date: formatLongDate(data.publishedAt),
    episodeNumber: data.episodeNumber,
    href: `${PRESS_ORIGIN}/podcasts/logos-state/${data.slug}`,
  }
}

export const getLatestPressArticles = async (limit = 4) => {
  const articlePosts = await getPressSearchItems('article', limit)
  return articlePosts.map(toArticleRow).filter(hasImage)
}

export const getPressPageData = async () => {
  const [articlePosts, podcastPosts] = await Promise.all([
    getPressSearchItems('article', 100),
    getPressSearchItems('podcast', 20),
  ])

  return {
    articles: articlePosts.map(toArticleRow).filter(hasImage),
    podcasts: podcastPosts.map(toPodcastRow).filter(hasImage),
  }
}

export const getLatestPressPodcasts = async (limit = 20) => {
  const podcastPosts = await getPressSearchItems('podcast', limit)
  return podcastPosts.map(toPodcastRow).filter(hasImage)
}
