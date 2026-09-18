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

export function youtubeVideoId(src: string): string | undefined {
  const url = firstUrl(src)
  if (!url) return undefined

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

export function youtubeEmbedUrl(src: string): string | undefined {
  const id = youtubeVideoId(src)
  return id ? `https://www.youtube.com/embed/${id}` : undefined
}
