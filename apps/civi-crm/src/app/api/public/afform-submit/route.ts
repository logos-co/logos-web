import { type NextRequest, NextResponse } from 'next/server'

import { isNotionIntakeSubmitEnabled } from '@/lib/intake-submit-flags'
import { submitToN8n } from '@/lib/n8n/submit'
import { resolveHearAboutLabel } from '@/lib/notion/build-notion-properties'
import { submitToNotion } from '@/lib/notion/submit'

const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET ?? ''

// Only the steward application funnels to the Circles n8n/Baserow CRM webhook.
const N8N_STEWARD_FORM = 'afformActivistLeaderSteward'

// The three funnel forms on apps/web. Each one writes to Notion and renders the
// required "How did you first hear about Logos?" select.
const ALLOWED_FORMS = new Set([
  'afformActivistBuilder',
  'afformActivistLeaderSteward',
  'afformCoalitionPartner',
])

async function verifyHCaptcha(
  token: string,
  remoteip: string
): Promise<boolean> {
  const res = await fetch('https://api.hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: HCAPTCHA_SECRET,
      response: token,
      remoteip,
    }),
  })
  const json = await res.json()
  return json.success === true
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
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400)
  }

  // `fields` carried the CiviCRM Afform field definitions. Nothing reads them
  // anymore, but it is dropped explicitly so a client that still sends the key
  // does not leak it into the Notion / n8n payloads.
  const {
    formName,
    captchaToken,
    fields: _fields,
    ...formData
  } = body as {
    formName?: string
    captchaToken?: string
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

  if (HCAPTCHA_SECRET) {
    if (!captchaToken || typeof captchaToken !== 'string') {
      return jsonResponse({ error: 'Captcha token missing' }, 400)
    }
    const valid = await verifyHCaptcha(captchaToken, getClientIp(req))
    if (!valid) {
      return jsonResponse({ error: 'Captcha verification failed' }, 403)
    }
  }

  if (formName === N8N_STEWARD_FORM) {
    const n8nResult = await submitToN8n(formData, formName)
    if (!n8nResult.ok) {
      console.error(`n8n steward webhook failed: ${n8nResult.message}`)
    }
  }

  if (!isNotionIntakeSubmitEnabled()) {
    return jsonResponse({ success: true }, 201)
  }

  const notionResult = await submitToNotion(formData, formName)
  if (!notionResult.ok) {
    return jsonResponse(
      {
        error: 'Failed to submit form. Please try again.',
        detail: notionResult.message,
      },
      502
    )
  }

  return jsonResponse({ success: true }, 201)
}
