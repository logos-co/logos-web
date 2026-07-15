export const BLOG_SEARCH_PAGE_SIZE = 15

const BLOG_SEARCH_API_URL = 'https://blog.logos.co/api/search'
const LOCAL_SEARCH_API_URL = '/api/legacy-search'
const DEFAULT_PODCAST_SHOW_SLUG = 'logos-state'

export type BlogSearchContentType = 'article' | 'podcast'

export interface BlogSearchPost {
  type: BlogSearchContentType
  title: string
  description: string
  slug: string
  publishedAt: string | null
  href: string
  image: {
    url: string
    alt: string
  } | null
}

export interface BlogSearchResult {
  posts: BlogSearchPost[]
  total: number
  hasMore: boolean
}

export interface BlogSearchRequest {
  query: string
  tags: readonly string[]
  types: readonly BlogSearchContentType[]
  skip?: number
  limit?: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const stringValue = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const parseSearchPost = (value: unknown): BlogSearchPost | null => {
  if (!isRecord(value) || !isRecord(value.data)) return null

  const type = value.type
  if (type !== 'article' && type !== 'podcast') return null

  const title = stringValue(value.data.title)
  const slug = stringValue(value.data.slug)
  if (!title || !slug) return null

  const coverImage = isRecord(value.data.coverImage)
    ? value.data.coverImage
    : null
  const imageUrl = stringValue(coverImage?.url)

  return {
    type,
    title,
    description: type === 'article' ? stringValue(value.data.subtitle) : '',
    slug,
    publishedAt:
      stringValue(
        type === 'article'
          ? (value.data.modifiedAt ?? value.data.publishedAt)
          : value.data.publishedAt
      ) || null,
    href:
      type === 'article'
        ? `/media/article/${slug}`
        : `/media/podcasts/${DEFAULT_PODCAST_SHOW_SLUG}/${slug}`,
    image: imageUrl
      ? {
          url: imageUrl,
          alt: stringValue(coverImage?.alt) || title,
        }
      : null,
  }
}

const runtimeSearchApiUrl = () => {
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  ) {
    return LOCAL_SEARCH_API_URL
  }

  return BLOG_SEARCH_API_URL
}

export function buildBlogSearchApiUrl(
  request: Readonly<BlogSearchRequest>,
  baseUrl = BLOG_SEARCH_API_URL
): string {
  const params = new URLSearchParams({
    skip: String(request.skip ?? 0),
    limit: String(request.limit ?? BLOG_SEARCH_PAGE_SIZE),
    q: request.query.trim() || ' ',
    tags: request.tags.join(','),
    type: request.types.join(','),
  })

  return `${baseUrl}?${params.toString()}`
}

export async function searchBlog(
  request: Readonly<BlogSearchRequest>,
  signal?: AbortSignal
): Promise<BlogSearchResult> {
  const response = await fetch(
    buildBlogSearchApiUrl(request, runtimeSearchApiUrl()),
    {
      headers: { Accept: 'application/json' },
      signal,
    }
  )

  if (!response.ok) {
    throw new Error(`Blog search failed with status ${response.status}`)
  }

  const payload: unknown = await response.json()
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new Error('Blog search returned an invalid response')
  }

  const rawPosts = Array.isArray(payload.data.posts) ? payload.data.posts : []
  const posts = rawPosts
    .map(parseSearchPost)
    .filter((post): post is BlogSearchPost => post !== null)
  const rawTotal = payload.data.total

  return {
    posts,
    total:
      typeof rawTotal === 'number' && Number.isFinite(rawTotal)
        ? rawTotal
        : posts.length,
    hasMore: payload.data.hasMore === true,
  }
}
