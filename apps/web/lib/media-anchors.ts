export const defaultMediaAnchorPrefix = 'media-content-'

export function mediaAnchorId(
  id: string,
  prefix = defaultMediaAnchorPrefix
): string {
  return prefix + id
}

export function mediaFragmentHref(id: string): string {
  return `#${encodeURIComponent(id)}`
}

export function mediaFragmentId(hash: string): string {
  const id = hash.replace(/^#/, '')
  try {
    return decodeURIComponent(id)
  } catch {
    return id
  }
}
