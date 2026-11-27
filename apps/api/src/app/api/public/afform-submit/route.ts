import { findInvalidRequiredFields } from '@repo/funnel'
import { type NextRequest, NextResponse } from 'next/server'

import { isNotionIntakeSubmitEnabled } from '@/lib/intake-submit-flags'
import { submitToN8n } from '@/lib/n8n/submit'
import { resolveHearAboutLabel } from '@/lib/notion/build-notion-properties'
import { submitToNotion } from '@/lib/notion/submit'
import { isPublicSiteHostnameAllowed } from '@/lib/public-cors'

// Only the steward application funnels to the Circles n8n/Baserow CRM webhook.
const N8N_STEWARD_FORM = 'afformActivistLeaderSteward'

// The three funnel forms on apps/web. Each one writes to Notion and renders the
// required "How did you first hear about Logos?" select.
const ALLOWED_FORMS = new Set([
  'afformActivistBuilder',
  'afformActivistLeaderSteward',
  'afformCoalitionPartner',
])

// The production site key; set HCAPTCHA_SITEKEYS when another deployment uses a different one.
const DEFAULT_HCAPTCHA_SITEKEYS = ['2ec82f0e-5f3c-45d2-ba38-223ceb5eee42']

function hCaptchaSitekeys(): string[] {
  const keys = (process.env.HCAPTCHA_SITEKEYS ?? '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
  return keys.length > 0 ? keys : DEFAULT_HCAPTCHA_SITEKEYS
}

interface HCaptchaVerifyResponse {
  success?: boolean
  hostname?: string
}

// hCaptcha returns this instead of the real hostname under heavy traffic.
const HCAPTCHA_HOSTNAME_NOT_PROVIDED = 'not-provided'

// The secret may serve more than one site key, so bind the token to the key the
// form rendered (one of ours) and to a site this API accepts submissions from.
// One call only: tokens are single-use.
async function verifyHCaptcha(
  secret: string,
  token: string,
  sitekey: string,
  remoteip: string
): Promise<boolean> {
  try {
    const res = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      signal: AbortSignal.timeout(5_000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip, sitekey }),
    })
    const json = (await res.json()) as HCaptchaVerifyResponse
    if (json.success !== true || typeof json.hostname !== 'string') {
      return false
    }
    return (
      json.hostname === HCAPTCHA_HOSTNAME_NOT_PROVIDED ||
      isPublicSiteHostnameAllowed(json.hostname)
    )
  } catch {
    return false
  }
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number
): NextResponse {
  return NextResponse.json(body, { status })
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400)
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse({ error: 'Invalid request body' }, 400)
  }

  // `fields` is dropped explicitly so a client that sends the key does not leak
  // it into the Notion / n8n payloads.
  const {
    formName,
    captchaToken,
    captchaSitekey,
    fields: _fields,
    ...formData
  } = body as {
    formName?: string
    captchaToken?: string
    captchaSitekey?: unknown
    fields?: unknown
    [key: string]: unknown
  }

  if (!formName || !ALLOWED_FORMS.has(formName)) {
    return jsonResponse({ error: 'Invalid form name' }, 400)
  }

  // The "hear about" select is required on the funnel forms. Enforce it here
  // rather than trusting the client: reject unless the submitted value resolves
  // to a known option id (the same predicate the Notion builder uses to write
  // it), so a scripted or tampered submission cannot skip the field or slip an
  // unknown value that the builder would silently drop. Enforced regardless of
  // the Notion enable flag so the requirement can't silently lapse when Notion
  // submission is toggled off.
  if (!resolveHearAboutLabel(formData)) {
    return jsonResponse({ error: 'Invalid or missing hear-about answer' }, 400)
  }

  // Same for the other required answers: the zod schema on apps/web is the only
  // other gate, so a scripted POST could write a row with no name or country.
  const invalidFields = findInvalidRequiredFields(formName, formData)
  if (invalidFields.length > 0) {
    return jsonResponse(
      { error: 'Missing or invalid required fields', fields: invalidFields },
      400
    )
  }

  const captchaSecret = process.env.HCAPTCHA_SECRET?.trim()
  if (captchaSecret) {
    if (!captchaToken || typeof captchaToken !== 'string') {
      return jsonResponse({ error: 'Captcha token missing' }, 400)
    }
    const sitekeys = hCaptchaSitekeys()
    const sitekey =
      typeof captchaSitekey === 'string' ? captchaSitekey : sitekeys[0]
    const valid =
      sitekeys.includes(sitekey) &&
      (await verifyHCaptcha(
        captchaSecret,
        captchaToken,
        sitekey,
        getClientIp(req)
      ))
    if (!valid) {
      return jsonResponse({ error: 'Captcha verification failed' }, 403)
    }
  } else {
    const isLocalRuntime =
      process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
    const isVercelDeployment =
      process.env.VERCEL_ENV === 'preview' ||
      process.env.VERCEL_ENV === 'production'
    if (!isLocalRuntime || isVercelDeployment) {
      return jsonResponse(
        { error: 'Captcha verification is temporarily unavailable' },
        503
      )
    }
  }

  // Notion first: when it rejects, the visitor is asked to retry, so nothing
  // may have reached n8n yet.
  if (isNotionIntakeSubmitEnabled()) {
    const notionResult = await submitToNotion(formData, formName)
    if (!notionResult.ok) {
      console.error(`Notion intake write failed: ${notionResult.message}`)
      return jsonResponse(
        { error: 'Failed to submit form. Please try again.' },
        502
      )
    }
  }

  if (formName === N8N_STEWARD_FORM) {
    const n8nResult = await submitToN8n(formData, formName)
    if (!n8nResult.ok) {
      console.error(`n8n steward webhook failed: ${n8nResult.message}`)
    }
  }

  return jsonResponse({ success: true }, 201)
}
