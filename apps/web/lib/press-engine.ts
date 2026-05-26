import { env } from '@/lib/env'

export const PRESS_ORIGIN = 'https://blog.logos.co'

const PRESS_SEARCH_API = `${PRESS_ORIGIN}/api/search`
const ADMIN_ACID_API_ORIGIN =
  env.NEXT_PUBLIC_ADMIN_ACID_API_URL ?? 'https://admin-acid.logos.co/api'
const CALENDAR_PUBLIC_PATH = '/calendar/public'
const PRESS_ARTICLE_IMAGE_OVERFETCH_MULTIPLIER = 3

export type PressArticleRow = {
  title: string
  titleSerif?: string
  date: string
  galleryDate: string
  author: string
  description: string
  /** Default large card image for backwards-compatible consumers. */
  image: string
  thumbnailImage: string
  galleryImage: string
  cardImage: string
  featuredImage: string
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
    episodeNumber?: number | null
    authors?: { name: string }[]
  }
  type: 'article' | 'podcast'
}

type PressArticlePageResponse = {
  props?: {
    pageProps?: {
      data?: {
        data?: {
          readingTime?: number | null
        }
      }
    }
  }
}

type PressSearchResponse = {
  data?: {
    posts?: PressSearchPost[]
  }
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

const truncate = (value: string, limit = BODY_SNIPPET_LIMIT) =>
  value.length > limit
    ? `${value.slice(0, limit)}…(${value.length} chars)`
    : value

type FetchResult<T> = { ok: true; data: T } | { ok: false; error: Error }

async function tryFetchText(
  url: string,
  label: string,
  cache: RequestCache,
  acceptJson: boolean
): Promise<FetchResult<{ text: string; contentType: string; status: number }>> {
  try {
    const response = await fetch(url, {
      cache,
      headers: acceptJson ? { Accept: 'application/json' } : undefined,
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
  const firstAttempt = await tryFetchText(url, label, 'force-cache', true)
  const parsed = parseFetchedJson<T>(firstAttempt, url, label)
  if (parsed.ok) return parsed.data

  const retry = await tryFetchText(url, label, 'no-store', true)
  const retryParsed = parseFetchedJson<T>(retry, url, label)
  if (retryParsed.ok) return retryParsed.data

  throw retryParsed.error
}

async function fetchTextResilient(url: string, label: string): Promise<string> {
  const firstAttempt = await tryFetchText(url, label, 'force-cache', false)
  if (firstAttempt.ok) return firstAttempt.data.text

  const retry = await tryFetchText(url, label, 'no-store', false)
  if (retry.ok) return retry.data.text

  throw retry.error
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

type PressImageVariant = 'thumbnail' | 'small' | 'large' | 'original'

const PRESS_IMAGE_VARIANT_PREFIXES = [
  'thumbnail_',
  'small_',
  'medium_',
  'large_',
] as const

const pressImageVariantPrefix = (variant: PressImageVariant) =>
  variant === 'original' ? '' : `${variant}_`

const getPressImageVariantUrl = (
  imageUrl: string,
  variant: PressImageVariant
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
        ? fileName.replace(
            /^(thumbnail_|small_|medium_|large_)/,
            ''
          )
        : fileName

    url.pathname = `${directory}${pressImageVariantPrefix(variant)}${baseFileName}`
    return url.toString()
  } catch {
    return imageUrl
  }
}

export const repeatToLength = <T>(items: T[], length: number): T[] =>
  Array.from({ length }, (_, index) => items[index % items.length])

const getPressSearchItems = async (
  type: 'article' | 'podcast',
  limit: number
): Promise<PressSearchPost[]> => {
  const url = `${PRESS_SEARCH_API}?type=${type}&limit=${limit}`
  const json = await fetchJsonResilient<PressSearchResponse>(
    url,
    'Press search'
  )
  return json.data?.posts?.filter((post) => post.type === type) ?? []
}

const getPositiveReadingTime = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined

const extractArticlePageReadingTime = (html: string) => {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  )
  if (!match) return undefined

  const pageData = JSON.parse(match[1]) as PressArticlePageResponse
  return getPositiveReadingTime(
    pageData.props?.pageProps?.data?.data?.readingTime
  )
}

const getArticlePageReadingTime = async (slug: string) => {
  const url = `${PRESS_ORIGIN}/article/${slug}`
  const html = await fetchTextResilient(url, 'Press article page')
  return extractArticlePageReadingTime(html)
}

const toArticleRow = (
  post: PressSearchPost,
  readingTimeOverride?: number
): PressArticleRow => {
  const data = post.data
  const author = data.authors?.map((item) => item.name).join(', ') || 'Logos'
  const description = stripHtml(data.subtitle || data.summary || '')
  const readingTime =
    readingTimeOverride ?? getPositiveReadingTime(data.readingTime) ?? 1
  const coverImage = data.coverImage?.url || ''
  const thumbnailImage = getPressImageVariantUrl(coverImage, 'thumbnail')
  const galleryImage = getPressImageVariantUrl(coverImage, 'small')
  const cardImage = getPressImageVariantUrl(coverImage, 'large')
  const featuredImage = getPressImageVariantUrl(coverImage, 'original')

  return {
    title: data.title,
    titleSerif: inferSerifPrefix(data.title),
    date: formatLongDate(data.publishedAt),
    galleryDate: formatGalleryDate(data.publishedAt),
    author,
    description,
    image: cardImage,
    thumbnailImage,
    galleryImage,
    cardImage,
    featuredImage,
    href: `${PRESS_ORIGIN}/article/${data.slug}`,
    readingTime,
  }
}

const toPodcastRow = (post: PressSearchPost): PressPodcastRow => {
  const data = post.data

  return {
    title: data.title,
    image: data.coverImage?.url || '',
    description: stripHtml(data.description || data.summary || ''),
    date: formatLongDate(data.publishedAt),
    episodeNumber: data.episodeNumber ?? undefined,
    href: `${PRESS_ORIGIN}/podcasts/logos-state/${data.slug}`,
  }
}

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

export const getLatestPressArticles = async (limit = 4) => {
  const searchLimit = Math.max(
    limit,
    limit * PRESS_ARTICLE_IMAGE_OVERFETCH_MULTIPLIER
  )
  const articlePosts = await getPressSearchItems('article', searchLimit)
  const visiblePosts = articlePosts
    .map((post) => ({ post, row: toArticleRow(post) }))
    .filter(({ row }) => hasImage(row))
    .slice(0, limit)

  return Promise.all(
    visiblePosts.map(async ({ post, row }) => {
      if (row.readingTime > 1) return row

      const pageReadingTime = await getArticlePageReadingTime(post.data.slug)
      return {
        ...row,
        readingTime: pageReadingTime ?? row.readingTime,
      }
    })
  )
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
