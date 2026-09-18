import MiniSearch, { type SearchOptions } from 'minisearch'

/**
 * Media search runs in the browser against an index written at build time
 * (scripts/generate-media-assets.ts), so it needs no server and no legacy
 * blog API. The index is fetched the first time the search dialog opens.
 */

export const MEDIA_SEARCH_INDEX_FILE = 'media-search-index.json'
export const MEDIA_SEARCH_PAGE_SIZE = 15

export type MediaSearchContentType = 'article' | 'podcast'

export interface MediaSearchImage {
  url: string
  alt: string
}

export interface MediaSearchDocument {
  /** `${type}:${slug}`: unique across articles and episodes. */
  id: string
  type: MediaSearchContentType
  slug: string
  title: string
  description: string
  /** Plain text of the body; only the longest transcripts are cut short. */
  body: string
  tags: string[]
  authors: string[]
  publishedAt: string | null
  href: string
  image: MediaSearchImage | null
}

export interface MediaSearchIndex {
  documents: MediaSearchDocument[]
}

export interface MediaSearchPost {
  type: MediaSearchContentType
  slug: string
  title: string
  description: string
  publishedAt: string | null
  href: string
  image: MediaSearchImage | null
}

export interface MediaSearchRequest {
  query: string
  tags: readonly string[]
  types: readonly MediaSearchContentType[]
  skip?: number
  limit?: number
}

export interface MediaSearchResult {
  posts: MediaSearchPost[]
  total: number
  hasMore: boolean
}

export interface MediaSearch {
  search: (request: Readonly<MediaSearchRequest>) => MediaSearchResult
  /** Every tag in use, most used first. */
  topics: string[]
}

/** Typos are forgiven only in words long enough for it to be a typo. */
const FUZZY_MIN_TERM_LENGTH = 5
const FUZZY_DISTANCE = 0.2

const SEARCH_OPTIONS: SearchOptions = {
  boost: { title: 4, tags: 2, authors: 2, description: 2 },
  prefix: true,
  fuzzy: (term) => (term.length >= FUZZY_MIN_TERM_LENGTH ? FUZZY_DISTANCE : 0),
}

const publishedTime = (document: MediaSearchDocument): number =>
  document.publishedAt ? Date.parse(document.publishedAt) : 0

const toPost = (document: MediaSearchDocument): MediaSearchPost => ({
  type: document.type,
  slug: document.slug,
  title: document.title,
  description: document.description,
  publishedAt: document.publishedAt,
  href: document.href,
  image: document.image,
})

/**
 * The CMS holds the same tag in different cases (`Blockchain`, `blockchain`).
 * They filter as one topic, shown in whichever spelling is used most.
 */
function rankTopics(documents: ReadonlyArray<MediaSearchDocument>): string[] {
  const topics = new Map<string, Map<string, number>>()
  for (const tag of documents.flatMap((document) => document.tags)) {
    const spellings = topics.get(tag.toLowerCase()) ?? new Map<string, number>()
    spellings.set(tag, (spellings.get(tag) ?? 0) + 1)
    topics.set(tag.toLowerCase(), spellings)
  }

  const ranked = [...topics.values()].map((spellings) => {
    const entries = [...spellings.entries()]
    const [label] = entries.reduce((best, entry) =>
      entry[1] > best[1] ? entry : best
    )
    const count = entries.reduce((sum, [, uses]) => sum + uses, 0)
    return { label, count }
  })
  return ranked
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .map((topic) => topic.label)
}

const containsPhrase = (document: MediaSearchDocument, phrase: string) =>
  [document.title, document.description, document.body].some((text) =>
    text.toLowerCase().includes(phrase)
  )

/**
 * The old blog matched a query as one phrase. Word matching finds more, so
 * posts that hold the exact phrase keep the top spots, in relevance order.
 */
function phraseFirst(
  query: string,
  documents: MediaSearchDocument[]
): MediaSearchDocument[] {
  const phrase = query.toLowerCase().replace(/\s+/g, ' ')
  if (!phrase.includes(' ')) return documents

  const exact = documents.filter((document) => containsPhrase(document, phrase))
  const rest = documents.filter((document) => !containsPhrase(document, phrase))
  return [...exact, ...rest]
}

export function createMediaSearch(
  documents: ReadonlyArray<MediaSearchDocument>
): MediaSearch {
  const byId = new Map(documents.map((document) => [document.id, document]))
  const index = new MiniSearch<MediaSearchDocument>({
    fields: ['title', 'description', 'tags', 'authors', 'body'],
    extractField: (document, field) => {
      const value = document[field as keyof MediaSearchDocument]
      return Array.isArray(value) ? value.join(' ') : String(value ?? '')
    },
    searchOptions: SEARCH_OPTIONS,
  })
  index.addAll(documents)

  const search = ({
    query,
    tags,
    types,
    skip = 0,
    limit = MEDIA_SEARCH_PAGE_SIZE,
  }: Readonly<MediaSearchRequest>): MediaSearchResult => {
    const wantedTags = new Set(tags.map((tag) => tag.toLowerCase()))
    const matchesFilters = (document: MediaSearchDocument) =>
      types.includes(document.type) &&
      (wantedTags.size === 0 ||
        document.tags.some((tag) => wantedTags.has(tag.toLowerCase())))

    const trimmed = query.trim()
    const matches = trimmed
      ? rankedMatches(trimmed, (id) => matchesFilters(byId.get(id)!))
      : documents
          .filter(matchesFilters)
          .sort((a, b) => publishedTime(b) - publishedTime(a))

    return {
      posts: matches.slice(skip, skip + limit).map(toPost),
      total: matches.length,
      hasMore: skip + limit < matches.length,
    }
  }

  // Every word first; if no post has them all, any word is better than none.
  const rankedMatches = (
    query: string,
    keep: (id: string) => boolean
  ): MediaSearchDocument[] => {
    const filter = (result: { id: string }) => keep(result.id)
    const allWords = index.search(query, { combineWith: 'AND', filter })
    const results =
      allWords.length > 0
        ? allWords
        : index.search(query, { combineWith: 'OR', filter })
    return phraseFirst(
      query,
      results.map((result) => byId.get(result.id)!)
    )
  }

  return { search, topics: rankTopics(documents) }
}

const loaded = new Map<string, Promise<MediaSearch>>()

/** Fetches and indexes once per URL; a failed load is retried next time. */
export function loadMediaSearch(indexUrl: string): Promise<MediaSearch> {
  const cached = loaded.get(indexUrl)
  if (cached) return cached

  const pending = (async () => {
    const response = await fetch(indexUrl)
    if (!response.ok) {
      throw new Error(
        `Media search index failed with status ${response.status}`
      )
    }
    const index = (await response.json()) as MediaSearchIndex
    return createMediaSearch(index.documents)
  })()
  loaded.set(indexUrl, pending)
  pending.catch(() => loaded.delete(indexUrl))
  return pending
}
