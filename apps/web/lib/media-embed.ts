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
