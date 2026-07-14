export type MediaSearchType = 'article' | 'podcast'

export interface MediaSearchEntry {
  type: MediaSearchType
  title: string
  description: string
  publishedAt: string | null
  href: string
  searchText: string
}

export interface MediaSearchOptions {
  types?: readonly MediaSearchType[]
}

const normalise = (value: string) =>
  value
    .normalize('NFKD')
    .toLocaleLowerCase()
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

const occurrences = (value: string, term: string) =>
  value.split(term).length - 1

const timestamp = (value: string | null) =>
  value ? new Date(value).getTime() : 0

const newestFirst = (a: MediaSearchEntry, b: MediaSearchEntry) =>
  timestamp(b.publishedAt) - timestamp(a.publishedAt)

function relevance(entry: MediaSearchEntry, terms: readonly string[]) {
  const title = normalise(entry.title)
  const description = normalise(entry.description)
  const body = normalise(entry.searchText)
  const combined = `${title} ${description} ${body}`

  if (!terms.every((term) => combined.includes(term))) return null

  return terms.reduce((score, term) => {
    const exactTitleBonus = title === term ? 50 : 0
    const titlePrefixBonus = title.startsWith(term) ? 16 : 0
    return (
      score +
      exactTitleBonus +
      titlePrefixBonus +
      occurrences(title, term) * 20 +
      occurrences(description, term) * 8 +
      Math.min(occurrences(body, term), 8) * 2
    )
  }, 0)
}

export function searchMediaEntries(
  entries: readonly MediaSearchEntry[],
  query: string,
  options: Readonly<MediaSearchOptions> = {}
): MediaSearchEntry[] {
  const selectedTypes = new Set<MediaSearchType>(
    options.types ?? ['article', 'podcast']
  )
  const filtered = entries.filter((entry) => selectedTypes.has(entry.type))
  const terms = normalise(query).split(/\s+/).filter(Boolean)

  if (terms.length === 0) return [...filtered].sort(newestFirst)

  return filtered
    .map((entry) => ({ entry, score: relevance(entry, terms) }))
    .filter(
      (result): result is { entry: MediaSearchEntry; score: number } =>
        result.score !== null
    )
    .sort(
      (a, b) =>
        b.score - a.score ||
        newestFirst(a.entry, b.entry) ||
        a.entry.title.localeCompare(b.entry.title)
    )
    .map(({ entry }) => entry)
}
