import { type NextRequest, NextResponse } from 'next/server'

const CIVICRM_BASE_URL = process.env.CIVICRM_BASE_URL ?? ''
const CIVICRM_API_KEY = process.env.CIVICRM_API_KEY ?? ''
const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET ?? ''

const ALLOWED_FORMS = new Set([
  'afformActivistBuilder',
  'afformActivistLeaderSteward',
  'afformCoalitionPartner',
])

const MULTI_RECORD_JOINS = new Set(['Website', 'IM'])

interface AfformField {
  formKey: string
  fieldName: string
  join: string | null
  inputType: string
}

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

function buildAfformValues(
  data: Record<string, unknown>,
  fieldDefs: AfformField[]
): Record<string, unknown> {
  const trim = (s: unknown) =>
    s && typeof s === 'string' ? s.trim() : ''
  const toArray = (v: unknown): string[] =>
    Array.isArray(v) ? (v as string[]) : v ? [String(v)] : []

  const fields: Record<string, unknown> = {}
  const joins: Record<string, Record<string, unknown>[]> = {}

  for (const fieldDef of fieldDefs) {
    if (!fieldDef.formKey) continue
    const { formKey, fieldName, join, inputType } = fieldDef
    const raw = data[formKey]

    if (!join) {
      if (inputType === 'checkbox') {
        fields[fieldName] = raw === true ? ['1'] : []
      } else if (inputType === 'select') {
        fields[fieldName] = toArray(raw)
          .map((s) => String(s).trim())
          .filter(Boolean)
      } else if (inputType === 'hidden') {
        if (raw != null) fields[fieldName] = raw
      } else {
        fields[fieldName] = trim(raw) || ''
      }
      continue
    }

    if (!joins[join]) joins[join] = []

    if (MULTI_RECORD_JOINS.has(join)) {
      const values = toArray(raw).map((s) => trim(s)).filter(Boolean)
      values.forEach((val, i) => {
        if (!joins[join][i]) joins[join][i] = {}
        joins[join][i][fieldName] =
          inputType === 'select' ? Number(val) || val : val
      })
    } else {
      if (!joins[join][0]) joins[join][0] = {}
      joins[join][0][fieldName] = trim(raw) || ''
    }
  }

  if (joins.Email?.[0]) joins.Email[0].is_primary = true
  if (joins.Address?.[0]) joins.Address[0].location_type_id = 3

  for (const joinName of Object.keys(joins)) {
    if (MULTI_RECORD_JOINS.has(joinName) && joins[joinName].length === 0) {
      joins[joinName] = []
    }
  }

  return {
    extra: [],
    Individual1: [{ fields, joins }],
  }
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
    fields?: AfformField[]
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

  try {
    const values = buildAfformValues(formData, fieldDefs)
    const params = JSON.stringify({ name: formName, values, args: {} })

    const res = await fetch(
      `${CIVICRM_BASE_URL}/civicrm/ajax/api4/Afform/submit`,
      {
        method: 'POST',
        headers: {
          'X-Civi-Auth': `Bearer ${CIVICRM_API_KEY}`,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `params=${encodeURIComponent(params)}`,
      }
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Afform.submit (${res.status}): ${text.slice(0, 200)}`)
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to submit form. Please try again.', detail: message },
      { status: 502 }
    )
  }
}
