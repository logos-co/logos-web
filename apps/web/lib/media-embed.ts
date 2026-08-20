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

export function youtubeEmbedUrl(src: string): string | undefined {
  try {
    const url = new URL(src.startsWith('//') ? `https:${src}` : src)
    const hostname = url.hostname.replace(/^www\./, '')

    if (hostname === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id ? `https://www.youtube.com/embed/${id}` : undefined
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      const id =
        url.searchParams.get('v') ??
        url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1]
      return id ? `https://www.youtube.com/embed/${id}` : undefined
    }
  } catch {
    return undefined
  }

  return undefined
}
