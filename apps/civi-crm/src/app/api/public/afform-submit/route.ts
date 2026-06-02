import { type NextRequest, NextResponse } from 'next/server'

import { type AfformFieldDef } from '@/lib/civicrm/build-afform-values'
import { submitToCiviCrm } from '@/lib/civicrm/submit-afform'
import {
  isCiviCrmIntakeSubmitEnabled,
  isNotionIntakeSubmitEnabled,
} from '@/lib/intake-submit-flags'
import { submitToNotion } from '@/lib/notion/submit'

const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET ?? ''

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

  const {
    formName,
    captchaToken,
    fields: fieldDefs,
    ...formData
  } = body as {
    formName?: string
    captchaToken?: string
    fields?: AfformFieldDef[]
    [key: string]: unknown
  }

  if (!formName || !ALLOWED_FORMS.has(formName)) {
    return jsonResponse({ error: 'Invalid form name' }, 400)
  }

  if (!fieldDefs || !Array.isArray(fieldDefs)) {
    return jsonResponse({ error: 'Missing field definitions' }, 400)
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

  const notionEnabled = isNotionIntakeSubmitEnabled()
  const civiEnabled = isCiviCrmIntakeSubmitEnabled()

  if (!notionEnabled && !civiEnabled) {
    return jsonResponse({ success: true }, 201)
  }

  if (notionEnabled) {
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
  }

  if (civiEnabled) {
    const civiResult = await submitToCiviCrm(formData, fieldDefs, formName)
    if (!civiResult.ok) {
      if (!notionEnabled) {
        return jsonResponse(
          {
            error: 'Failed to submit form. Please try again.',
            detail: civiResult.message,
          },
          502
        )
      }
      return jsonResponse({ success: true, detail: civiResult.message }, 201)
    }
  }

  return jsonResponse({ success: true }, 201)
}
