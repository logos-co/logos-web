/**
 * Transport for the one-pager upload page.
 *
 * The site is a static export (`output: 'export'`), so there is no route to
 * proxy through: the browser talks to `admin-acid.logos.co` directly, the same
 * way `lib/newsletter-signup.ts` does. The deployed upstreams allowlist
 * Logos-owned origins for CORS, so a page served from `localhost` can only
 * reach a local admin run with `IS_DEV_ENV=true`; otherwise unit tests are the
 * verification.
 *
 * Both requests are deliberately CORS-safelisted -- a `GET`, and a
 * `multipart/form-data` `POST` carrying the token as a form field rather than a
 * header -- so neither fires a preflight.
 */
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

export const ONE_PAGER_ENDPOINTS = {
  // Port 3003, the same as `SUBSCRIBE_ENDPOINTS` in `newsletter-signup.ts`:
  // the two upstream endpoints are the same app, so they move together.
  development: 'http://localhost:3003/api/funnel/one-pager',
  staging: 'https://dev-admin-acid.logos.co/api/funnel/one-pager',
  production: 'https://admin-acid.logos.co/api/funnel/one-pager',
} as const

export const ONE_PAGER_MIME_TYPE = 'application/pdf'

/** Both forms: the extension is the more reliable filter in the file picker. */
export const ONE_PAGER_ACCEPT = `.pdf,${ONE_PAGER_MIME_TYPE}`

/**
 * Kept equal to `ONE_PAGER_MAX_BYTES` in logos-admin
 * (`lib/utils/one-pager-pdf.ts`), which is the authority. A client check only
 * saves the candidate an 8 MB round trip, so it must never be looser.
 */
export const ONE_PAGER_MAX_BYTES = 8 * 1024 * 1024

export const ONE_PAGER_MAX_MB = ONE_PAGER_MAX_BYTES / (1024 * 1024)

/** The page count (<= 2) is checked server-side only: no PDF parser ships here. */
export type FileValidationResult = { ok: true } | { ok: false; reason: FileError }

export type FileError = 'type' | 'empty' | 'size'

export type LinkStatus = 'valid' | 'used' | 'invalid' | 'unknown'

export type UploadResult =
  | { status: 'ok' }
  | { status: 'used' }
  | { status: 'error'; message: string }

type StatusResponse = { valid?: unknown; used?: unknown }

type UploadResponse = { error?: unknown }

function getEndpoint(): string {
  const mode = env.NEXT_PUBLIC_API_MODE ?? 'production'
  return ONE_PAGER_ENDPOINTS[mode]
}

/** Type and size only, for fast feedback; the server stays the authority. */
export function validateOnePagerFile(file: File): FileValidationResult {
  if (file.type !== ONE_PAGER_MIME_TYPE) {
    return { ok: false, reason: 'type' }
  }
  if (file.size === 0) {
    return { ok: false, reason: 'empty' }
  }
  if (file.size > ONE_PAGER_MAX_BYTES) {
    return { ok: false, reason: 'size' }
  }
  return { ok: true }
}

/**
 * Whether the link is still good, so the page can say so before a file is
 * picked. A failed request resolves to `'unknown'`, never `'invalid'`: the call
 * is blocked outright on `localhost` and can fail transiently anywhere, and the
 * POST is the real authority.
 *
 * The upstream cannot tell a forged token from an expired one, so both arrive
 * as `'invalid'`.
 */
export async function fetchOnePagerLinkStatus(
  token: string
): Promise<LinkStatus> {
  const url = `${getEndpoint()}?${new URLSearchParams({ t: token }).toString()}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      logger.warn('One-pager link check failed', { status: response.status })
      return 'unknown'
    }

    const data = (await response.json()) as StatusResponse
    if (data.valid !== true) return 'invalid'
    return data.used === true ? 'used' : 'valid'
  } catch (error) {
    logger.warn('One-pager link check errored', { error })
    return 'unknown'
  }
}

/**
 * Upload the PDF. Never rejects: the upstream's error strings are already
 * user-presentable, so they are handed back as-is, and a `409` on a spent link
 * is a state the page renders rather than an error banner.
 */
export async function submitOnePager(
  token: string,
  file: File,
  fallbackMessage: string
): Promise<UploadResult> {
  const body = new FormData()
  body.append('token', token)
  body.append('file', file)

  let response: Response
  try {
    // No `Content-Type`: the browser sets the multipart boundary.
    response = await fetch(getEndpoint(), { method: 'POST', body })
  } catch (error) {
    logger.warn('One-pager upload errored', { error })
    return { status: 'error', message: fallbackMessage }
  }

  if (response.ok) return { status: 'ok' }

  const data = (await response.json().catch(() => ({}))) as UploadResponse
  const message = typeof data.error === 'string' ? data.error : fallbackMessage

  // Two upstream cases share the 409: a spent link, and an upload already in
  // flight (retryable). Ask the status endpoint which it was rather than
  // matching on the message prose.
  if (response.status === 409 && (await fetchOnePagerLinkStatus(token)) === 'used') {
    return { status: 'used' }
  }

  return { status: 'error', message }
}
