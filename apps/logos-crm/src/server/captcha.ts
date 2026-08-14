import { getServerEnv } from '@/server/env'

const HCAPTCHA_VERIFY_URL = 'https://api.hcaptcha.com/siteverify'

/** hCaptcha is unreachable more often than it is wrong; do not hang on it. */
const VERIFY_TIMEOUT_MS = 5_000

export type CaptchaOutcome =
  | { ok: true; skipped: boolean }
  | {
      ok: false
      reason: 'missing_token' | 'rejected' | 'unavailable' | 'not_configured'
    }

/**
 * Verifies an hCaptcha token for the public intake endpoint.
 *
 * Called before anything is stored. Verifying afterwards would leave a spam run
 * with a table full of submissions to clean up, which is most of the damage the
 * check exists to prevent.
 *
 * With no secret configured the check is skipped rather than failing closed, so
 * local development and tests do not need one. Production cannot reach this
 * state: `getServerEnv` refuses to start without the secret.
 */
export async function verifyCaptcha(
  token: string | undefined,
  clientIp: string | null
): Promise<CaptchaOutcome> {
  const { HCAPTCHA_SECRET, NODE_ENV } = getServerEnv()

  if (!HCAPTCHA_SECRET) {
    // Failing closed rather than open: an unprotected public endpoint that
    // looks protected is the outcome this check exists to prevent. Checked per
    // request so a build without secrets is unaffected.
    if (NODE_ENV === 'production')
      return { ok: false, reason: 'not_configured' }
    return { ok: true, skipped: true }
  }
  if (!token) return { ok: false, reason: 'missing_token' }

  const body = new URLSearchParams({
    secret: HCAPTCHA_SECRET,
    response: token,
    ...(clientIp ? { remoteip: clientIp } : {}),
  })

  try {
    const response = await fetch(HCAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    })

    if (!response.ok) return { ok: false, reason: 'unavailable' }

    const result = (await response.json()) as { success?: boolean }
    return result.success === true
      ? { ok: true, skipped: false }
      : { ok: false, reason: 'rejected' }
  } catch {
    // A verifier outage must not be reported as a rejected human: the caller
    // distinguishes the two so the visitor gets a retry rather than an
    // accusation.
    return { ok: false, reason: 'unavailable' }
  }
}

export function readClientIp(request: Request): string | null {
  const forwarded = request.headers
    .get('x-forwarded-for')
    ?.split(',')[0]
    ?.trim()
  return forwarded || request.headers.get('x-real-ip') || null
}
