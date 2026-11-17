/**
 * GitHub's API rejects unauthenticated requests without a User-Agent. A token
 * (optional) lifts the 60 req/hr unauthenticated rate limit during CI builds.
 */
const githubHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'logos-web-build',
  }
  const token = process.env.GITHUB_TOKEN
  if (token) headers.Authorization = `token ${token}`
  return headers
}

const publicMirrorHeaders: Readonly<Record<string, string>> = {
  'User-Agent': 'logos-web-build',
}

const contentHeaders = (url: string): Readonly<Record<string, string>> => {
  try {
    return new URL(url).hostname === 'api.github.com'
      ? githubHeaders()
      : publicMirrorHeaders
  } catch {
    return publicMirrorHeaders
  }
}

type GithubContentEntry = {
  name: string
  download_url: string | null
  html_url: string | null
  git_url?: string | null
}

const isContentEntry = (value: unknown): value is GithubContentEntry =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as GithubContentEntry).name === 'string'

type GithubBlobResponse = {
  content?: string
  encoding?: string
}

type JsDelivrFlatResponse = {
  files?: unknown
}

/** Signals `withRetry` that the failure is transient and worth another round. */
class RetryableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'RetryableError'
  }
}

const RETRY_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 500

/**
 * Statuses worth a second look: GitHub answers rate limits with 403/429 and
 * transient upstream trouble with 5xx. A 404 is a definitive answer -- retrying
 * it only delays the next fallback URL.
 */
const isRetryableStatus = (status: number): boolean =>
  status === 403 || status === 429 || status >= 500

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Runs `attempt` up to `RETRY_ATTEMPTS` times with exponential backoff, so a
 * transient GitHub failure doesn't fail the build on the first try. `attempt`
 * returns `null` to give up immediately and throws `RetryableError` to ask for
 * another round. Resolves to `null` once every attempt is spent.
 */
const withRetry = async <T>(
  attempt: () => Promise<T | null>
): Promise<T | null> => {
  for (let round = 1; round <= RETRY_ATTEMPTS; round++) {
    try {
      return await attempt()
    } catch (error) {
      if (!(error instanceof RetryableError) || round === RETRY_ATTEMPTS) {
        return null
      }
      await wait(RETRY_BASE_DELAY_MS * 2 ** (round - 1))
    }
  }
  return null
}

const fetchTextWithRetry = (
  url: string,
  headers: Readonly<Record<string, string>>
): Promise<string | null> =>
  withRetry(async () => {
    let res: Response
    try {
      res = await fetch(url, { headers })
    } catch (error) {
      throw new RetryableError(`Request to ${url} failed`, { cause: error })
    }
    if (res.ok) return res.text()
    if (isRetryableStatus(res.status)) {
      throw new RetryableError(`${url} responded ${res.status}`)
    }
    return null
  })

const fetchGithubBlob = async (
  url: string,
  headers: Readonly<Record<string, string>>
): Promise<string | null> => {
  try {
    const res = await fetch(url, { headers })
    if (!res.ok) return null
    const body = (await res.json()) as GithubBlobResponse
    if (body.encoding !== 'base64' || typeof body.content !== 'string') {
      return null
    }
    return Buffer.from(body.content.replace(/\s/g, ''), 'base64').toString(
      'utf8'
    )
  } catch {
    return null
  }
}

const rawUrlFromHtmlUrl = (htmlUrl: string | null): string | null => {
  if (!htmlUrl) return null
  try {
    const url = new URL(htmlUrl)
    if (url.hostname !== 'github.com') return null
    url.hostname = 'raw.githubusercontent.com'
    url.pathname = url.pathname.replace('/blob/', '/')
    return url.href
  } catch {
    return null
  }
}

const fetchMarkdownEntry = async (
  entry: GithubContentEntry,
  mirrorBaseUrl: string
): Promise<string | null> => {
  if (entry.download_url) {
    const raw = await fetchTextWithRetry(
      entry.download_url,
      contentHeaders(entry.download_url)
    )
    if (raw) return raw
  }

  const rawUrl = rawUrlFromHtmlUrl(entry.html_url)
  if (rawUrl && rawUrl !== entry.download_url) {
    const raw = await fetchTextWithRetry(rawUrl, contentHeaders(rawUrl))
    if (raw) return raw
  }

  if (entry.git_url) {
    const blob = await fetchGithubBlob(
      entry.git_url,
      contentHeaders(entry.git_url)
    )
    if (blob) return blob
  }

  const fallbackUrl = `${mirrorBaseUrl}${encodeURIComponent(entry.name)}`
  return fetchTextWithRetry(fallbackUrl, publicMirrorHeaders)
}

const parseMirrorListing = (
  value: unknown,
  folder: string,
  mirrorBaseUrl: string,
  githubBaseUrl: string
): GithubContentEntry[] | null => {
  if (typeof value !== 'object' || value === null) return null

  const files = (value as JsDelivrFlatResponse).files
  if (!Array.isArray(files)) return null

  return files.flatMap((file): GithubContentEntry[] => {
    if (typeof file !== 'object' || file === null) return []

    const path = (file as { name?: unknown }).name
    if (typeof path !== 'string' || !path.startsWith(`/${folder}/`)) return []

    const name = path.slice(`/${folder}/`.length)
    if (!name || name.includes('/')) return []

    const encodedName = encodeURIComponent(name)
    return [
      {
        name,
        download_url: `${mirrorBaseUrl}${encodedName}`,
        html_url: `${githubBaseUrl}${encodedName}`,
        git_url: null,
      },
    ]
  })
}

export function githubMarkdownDirectory(repo: string, folder: string) {
  const contentsUrl = `https://api.github.com/repos/${repo}/contents/${folder}`
  const mirrorListingUrl = `https://data.jsdelivr.com/v1/package/gh/${repo}@master/flat`
  const mirrorBaseUrl = `https://cdn.jsdelivr.net/gh/${repo}@master/${folder}/`
  const githubBaseUrl = `https://github.com/${repo}/blob/master/${folder}/`
  const parseListing = (value: unknown) =>
    parseMirrorListing(value, folder, mirrorBaseUrl, githubBaseUrl)

  const fetchMirrorListing = async (): Promise<GithubContentEntry[] | null> => {
    const raw = await fetchTextWithRetry(mirrorListingUrl, publicMirrorHeaders)
    if (!raw) return null

    try {
      return parseListing(JSON.parse(raw))
    } catch {
      return null
    }
  }

  /** Lists the source directory, falling back to the public mirror after GitHub failures. */
  const list = async (): Promise<GithubContentEntry[]> => {
    let lastFailure = 'no response'
    const entries = await withRetry<unknown>(async () => {
      let res: Response
      try {
        res = await fetch(contentsUrl, { headers: githubHeaders() })
      } catch (error) {
        lastFailure = error instanceof Error ? error.message : 'request failed'
        throw new RetryableError(lastFailure, { cause: error })
      }
      if (!res.ok) {
        lastFailure = `${res.status} ${res.statusText}`
        if (isRetryableStatus(res.status)) throw new RetryableError(lastFailure)
        return null
      }
      try {
        return await res.json()
      } catch (error) {
        lastFailure = 'listing response was not valid JSON'
        throw new RetryableError(lastFailure, { cause: error })
      }
    })

    if (Array.isArray(entries)) {
      return entries.filter(isContentEntry)
    }

    if (entries !== null) lastFailure = 'listing response was not an array'

    const fallbackEntries = await fetchMirrorListing()
    if (fallbackEntries?.length) return fallbackEntries

    throw new Error(
      `Failed to list ${repo}/${folder} from GitHub (${lastFailure}) and jsDelivr`
    )
  }

  return {
    list,
    parseListing,
    read: (entry: GithubContentEntry) =>
      fetchMarkdownEntry(entry, mirrorBaseUrl),
  }
}
