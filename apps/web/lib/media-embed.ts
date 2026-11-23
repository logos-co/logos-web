/**
 * Apple Podcasts has no counterpart here on purpose: embed.podcasts.apple.com
 * never mounts its player and renders an empty placeholder, so Apple episodes
 * are played from their resolved audio file instead. See lib/podcast-feed.ts.
 */
export function spotifyEmbedUrl(src: string): string | undefined {
  try {
    const url = new URL(src.startsWith('//') ? `https:${src}` : src)

    if (url.hostname.replace(/^www\./, '') !== 'open.spotify.com') {
      return undefined
    }

    // Locale-prefixed share links look like /intl-ko/episode/<id>.
    const [type, id] = url.pathname
      .split('/')
      .filter((segment) => Boolean(segment) && !segment.startsWith('intl-'))

    if (!id) return undefined

    return type === 'episode' || type === 'show'
      ? `https://open.spotify.com/embed/${type}/${id}`
      : undefined
  } catch {
    return undefined
  }
}

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

/**
 * Some CMS fields hold several links separated by newlines. The URL parser
 * strips newlines instead of stopping at them, so only the first link is read.
 */
function firstUrl(src: string): URL | undefined {
  const [first] = src.trim().split(/\s+/)
  if (!first) return undefined
  try {
    return new URL(first.startsWith('//') ? `https:${first}` : first)
  } catch {
    return undefined
  }
}

function youtubeIdFromUrl(url: URL): string | undefined {
  const hostname = url.hostname.replace(/^(?:www|m)\./, '')
  const id =
    hostname === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : hostname === 'youtube.com'
        ? (url.searchParams.get('v') ??
          url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1])
        : undefined

  return id && YOUTUBE_VIDEO_ID_PATTERN.test(id) ? id : undefined
}

export function youtubeVideoId(src: string): string | undefined {
  const url = firstUrl(src)
  return url ? youtubeIdFromUrl(url) : undefined
}

const YOUTUBE_FRAME_URL =
  /^https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/[\w-]{11}(?:\?[^#\s]*)?$/
const SECONDS = /^\d{1,9}$/

function sharedYoutubeStart(value: string | null): string | undefined {
  if (!value) return undefined
  if (SECONDS.test(value)) return value

  const parts = /^(?:(\d{1,6})h)?(?:(\d{1,7})m)?(?:(\d{1,9})s)?$/.exec(value)
  if (!parts) return undefined

  const seconds =
    Number(parts[1] ?? 0) * 3600 +
    Number(parts[2] ?? 0) * 60 +
    Number(parts[3] ?? 0)
  return seconds <= 999_999_999 ? String(seconds) : undefined
}

function youtubePlaybackOptions(url: URL): URLSearchParams {
  const params = new URLSearchParams()
  const start = url.searchParams.get('start')
  const sharedStart =
    start && SECONDS.test(start)
      ? start
      : sharedYoutubeStart(url.searchParams.get('t'))
  if (sharedStart !== undefined) params.set('start', sharedStart)

  const end = url.searchParams.get('end')
  if (end && SECONDS.test(end)) params.set('end', end)

  for (const key of ['controls', 'rel', 'playsinline', 'cc_load_policy']) {
    const value = url.searchParams.get(key)
    if (value === '0' || value === '1') params.set(key, value)
  }
  return params
}

export function youtubeEmbedUrl(src: string): string | undefined {
  const source = firstUrl(src)
  if (!source) return undefined
  const id = youtubeIdFromUrl(source)
  if (!id) return undefined

  const url = new URL(`https://www.youtube.com/embed/${id}`)
  url.search = youtubePlaybackOptions(source).toString()
  return url.toString()
}

export function normaliseYoutubeFrameUrl(src: string): string | undefined {
  if (!YOUTUBE_FRAME_URL.test(src)) return undefined

  const url = new URL(src)
  url.search = youtubePlaybackOptions(url).toString()
  return url.toString()
}
