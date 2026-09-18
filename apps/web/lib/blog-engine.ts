import { ROUTES } from '@/constants/routes'
import {
  getAllBlogArticles,
  getAllBlogPodcasts,
  isPublishedPost,
  type BlogArticleDetail,
  type BlogPodcastDetail,
  type BlogPostMeta,
} from '@/lib/blog-content'
import { env } from '@/lib/env'

const ADMIN_ACID_API_ORIGIN =
  env.NEXT_PUBLIC_ADMIN_ACID_API_URL ?? 'https://admin-acid.logos.co/api'
const CALENDAR_PUBLIC_PATH = '/calendar/public'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

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

export type BlogPodcastRow = {
  title: string
  image: string
  description: string
  date: string
  episodeNumber?: number
  href: string
}

export type BroadcastEventRow = {
  id: number
  title: string
  calendarTitle: string
  description: string
  host: string
  date: string
  time?: string
  dateLabel: string
  localDateKey: string
  localTimestamp: number
  timeMinutes: number | null
  links: string[]
  link?: string
}

type CalendarEvent = {
  id: number
  date: string
  time?: string | null
  type: {
    label: string
    value: string
  }
  guest: string | null
  speakers: (string | null)[]
  topic: string | null
  notes: string | null
  links?: string[]
}

type CalendarResponse = {
  success?: boolean
  data?: CalendarEvent[]
}

const BODY_SNIPPET_LIMIT = 200

/**
 * A failed first attempt is usually a short hiccup on the blog API, so give it
 * a moment before retrying. Without this the retry lands within milliseconds
 * of the failure and hits the same bad state.
 */
const RETRY_DELAY_MS = 400

const truncate = (value: string, limit = BODY_SNIPPET_LIMIT) =>
  value.length > limit
    ? `${value.slice(0, limit)}…(${value.length} chars)`
    : value

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

type FetchResult<T> = { ok: true; data: T } | { ok: false; error: Error }

async function tryFetchText(
  url: string,
  label: string,
  acceptJson: boolean,
  retry = false
): Promise<FetchResult<{ text: string; contentType: string; status: number }>> {
  try {
    const headers: Record<string, string> = {}
    if (acceptJson) headers.Accept = 'application/json'
    // Both attempts use `force-cache` so the route stays static for
    // `output: 'export'`. Next puts request headers in the fetch cache key, so
    // this header is what keeps the retry from resolving to the first
    // attempt's cache entry. Do not swap it for `no-store` or
    // `revalidate: 0`: either one makes the route dynamic and fails the export.
    if (retry) headers['X-Logos-Build-Retry'] = '1'

    const response = await fetch(url, {
      cache: 'force-cache',
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    })
    const text = await response.text()
    const contentType = response.headers.get('content-type') ?? '<missing>'
    if (!response.ok) {
      return {
        ok: false,
        error: new Error(
          `${label} failed: status=${response.status} content-type=${contentType} url=${url} body=${truncate(text)}`
        ),
      }
    }
    return { ok: true, data: { text, contentType, status: response.status } }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      error: new Error(`${label} fetch threw: ${message} url=${url}`),
    }
  }
}

function parseFetchedJson<T>(
  result: FetchResult<{ text: string; contentType: string; status: number }>,
  url: string,
  label: string
): FetchResult<T> {
  if (!result.ok) return result
  const { text, contentType, status } = result.data
  try {
    return { ok: true, data: JSON.parse(text) as T }
  } catch {
    return {
      ok: false,
      error: new Error(
        `${label} returned non-JSON: status=${status} content-type=${contentType} url=${url} body=${truncate(text)}`
      ),
    }
  }
}

async function fetchJsonResilient<T>(url: string, label: string): Promise<T> {
  const firstAttempt = await tryFetchText(url, label, true)
  const parsed = parseFetchedJson<T>(firstAttempt, url, label)
  if (parsed.ok) return parsed.data

  await wait(RETRY_DELAY_MS)
  const retry = await tryFetchText(url, label, true, true)
  const retryParsed = parseFetchedJson<T>(retry, url, label)
  if (retryParsed.ok) return retryParsed.data

  throw retryParsed.error
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

const formatEventDateLabel = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${iso}T00:00:00.000Z`))

const getDateParts = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return null
  return { year, month, day }
}

const getTimeParts = (
  time?: string | null
): { hours: number; minutes: number } | null => {
  const trimmedTime = time?.trim()
  if (!trimmedTime) return null

  const twentyFourHourMatch = /^(\d{1,2}):(\d{2})$/.exec(trimmedTime)
  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1])
    const minutes = Number(twentyFourHourMatch[2])
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes }
    }
  }

  const twelveHourMatch = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(trimmedTime)
  if (twelveHourMatch) {
    const rawHours = Number(twelveHourMatch[1])
    const minutes = Number(twelveHourMatch[2])
    const period = twelveHourMatch[3].toLowerCase()
    if (rawHours >= 1 && rawHours <= 12 && minutes >= 0 && minutes <= 59) {
      const hours =
        period === 'pm' ? (rawHours % 12) + 12 : rawHours === 12 ? 0 : rawHours
      return { hours, minutes }
    }
  }

  return null
}

const getEventLocalDateTime = (event: CalendarEvent) => {
  const dateParts = getDateParts(event.date)
  if (!dateParts) return null

  const timeParts = getTimeParts(event.time)
  const hours = timeParts?.hours ?? 0
  const minutes = timeParts?.minutes ?? 0

  return new Date(
    Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, hours, minutes)
  )
}

const getEventTimeMinutesSinceMidnight = (time?: string | null) => {
  const timeParts = getTimeParts(time)
  if (!timeParts) return null

  return timeParts.hours * 60 + timeParts.minutes
}

const formatLocalDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

const isMeaningful = (value?: string | null) => {
  if (!value) return false
  return value.trim().length > 0 && value.trim().toLowerCase() !== 'null'
}

const meaningfulText = (value?: string | null) =>
  isMeaningful(value) ? value!.trim() : ''

const getEventLinks = (links?: string[]) =>
  links?.map(meaningfulText).filter(Boolean) ?? []

const toBroadcastEventRow = (event: CalendarEvent): BroadcastEventRow => {
  const typeLabel = event.type.label
  const topic = meaningfulText(event.topic)
  const calendarTitle = topic || typeLabel || 'Event'
  const guest = meaningfulText(event.guest)
  const speakers = event.speakers.map(meaningfulText).filter(Boolean).join(', ')
  const host = speakers || guest || 'Logos Network'
  const detailParts = [topic, guest].filter(Boolean)
  const localDateTime =
    getEventLocalDateTime(event) ?? new Date(`${event.date}T00:00:00.000Z`)
  const links = getEventLinks(event.links)

  return {
    id: event.id,
    title: typeLabel || calendarTitle,
    calendarTitle,
    description:
      detailParts.join(' featuring ') ||
      'Live streams, updates, and regular programming from the Logos network.',
    host,
    date: event.date,
    time: event.time ?? undefined,
    dateLabel: formatEventDateLabel(event.date),
    localDateKey: formatLocalDateKey(localDateTime),
    localTimestamp: localDateTime.getTime(),
    timeMinutes: getEventTimeMinutesSinceMidnight(event.time),
    links,
    link: links[0],
  }
}

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

export const getBroadcastEvents = async () => {
  const url = `${ADMIN_ACID_API_ORIGIN}${CALENDAR_PUBLIC_PATH}`
  const json = await fetchJsonResilient<CalendarResponse>(
    url,
    'Broadcast calendar'
  )
  if (!json.success || !json.data) {
    throw new Error(
      `Broadcast calendar returned an invalid response: url=${url} success=${json.success} hasData=${Boolean(json.data)}`
    )
  }

  const uniqueEvents = Array.from(
    new Map(json.data.map((event) => [event.id, event])).values()
  )

  return uniqueEvents.map(toBroadcastEventRow).sort((a, b) => {
    if (a.localTimestamp !== b.localTimestamp) {
      return a.localTimestamp - b.localTimestamp
    }

    const minutesA = a.timeMinutes ?? Number.MAX_SAFE_INTEGER
    const minutesB = b.timeMinutes ?? Number.MAX_SAFE_INTEGER
    if (minutesA !== minutesB) return minutesA - minutesB

    return a.id - b.id
  })
}
