import { type NextRequest, NextResponse } from 'next/server'

import { type AfformFieldDef } from '@/lib/civicrm/build-afform-values'
import { submitToCiviCrm } from '@/lib/civicrm/submit-afform'

const CIVICRM_BASE_URL = process.env.CIVICRM_BASE_URL ?? ''
const CIVICRM_API_KEY = process.env.CIVICRM_API_KEY ?? ''
const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET ?? ''

const ALLOWED_FORMS = new Set([
  'afformActivistBuilder',
  'afformActivistLeaderSteward',
  'afformCoalitionPartner',
])

async function verifyHCaptcha(token: string, remoteip: string): Promise<boolean> {
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

export async function POST(req: NextRequest) {
  if (!CIVICRM_BASE_URL || !CIVICRM_API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

  const { formName, captchaToken, fields: fieldDefs, ...formData } = body as {
    formName?: string
    captchaToken?: string
    fields?: AfformFieldDef[]
    [key: string]: unknown
  }

  if (!formName || !ALLOWED_FORMS.has(formName)) {
    return NextResponse.json({ error: 'Invalid form name' }, { status: 400 })
  }

  if (!fieldDefs || !Array.isArray(fieldDefs)) {
    return NextResponse.json(
      { error: 'Missing field definitions' },
      { status: 400 }
    )
  }

  if (HCAPTCHA_SECRET) {
    if (!captchaToken || typeof captchaToken !== 'string') {
      return NextResponse.json(
        { error: 'Captcha token missing' },
        { status: 400 }
      )
    }
    const valid = await verifyHCaptcha(captchaToken, getClientIp(req))
    if (!valid) {
      return NextResponse.json(
        { error: 'Captcha verification failed' },
        { status: 403 }
      )
    }
  }

  const result = await submitToCiviCrm(formData, fieldDefs, formName)

  if (!result.ok) {
    return NextResponse.json(
      {
        error: 'Failed to submit form. Please try again.',
        detail: result.message,
      },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
