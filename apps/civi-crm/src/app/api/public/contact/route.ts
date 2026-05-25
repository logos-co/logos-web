import { type NextRequest, NextResponse } from 'next/server'
import { civiClient } from '@/lib/civicrm/client'

const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET ?? ''
const CASE_TYPE_ID = 4
const CASE_STATUS_ID = 11

interface AfformField {
  formKey: string
  fieldName: string
  join: string | null
  inputType: string
}

const MULTI_RECORD_JOINS = new Set(['Website', 'IM'])

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

function buildEntityData(
  data: Record<string, unknown>,
  fieldDefs: AfformField[]
) {
  const trim = (s: unknown) =>
    s && typeof s === 'string' ? s.trim() : ''
  const toArray = (v: unknown): string[] =>
    Array.isArray(v) ? (v as string[]) : v ? [String(v)] : []

  const contactValues: Record<string, unknown> = { contact_type: 'Individual' }
  const joinRecords: Record<string, Record<string, unknown>[]> = {}

  for (const fieldDef of fieldDefs) {
    if (!fieldDef.formKey) continue
    const { formKey, fieldName, join, inputType } = fieldDef
    const raw = data[formKey]

    if (!join) {
      if (inputType === 'checkbox') {
        contactValues[fieldName] = raw === true ? ['1'] : []
      } else if (inputType === 'select') {
        contactValues[fieldName] = toArray(raw)
          .map((s) => String(s).trim())
          .filter(Boolean)
      } else if (inputType !== 'hidden') {
        contactValues[fieldName] = trim(raw) || ''
      }
      continue
    }

    if (!joinRecords[join]) joinRecords[join] = []

    if (MULTI_RECORD_JOINS.has(join)) {
      const values = toArray(raw)
        .map((s) => String(s).trim())
        .filter(Boolean)
      values.forEach((val, i) => {
        if (!joinRecords[join][i]) joinRecords[join][i] = {}
        joinRecords[join][i][fieldName] =
          inputType === 'select' ? Number(val) || val : val
      })
    } else {
      if (!joinRecords[join][0]) joinRecords[join][0] = {}
      const val =
        inputType === 'textarea'
          ? [trim(raw), data.socials ? trim(data.socials) : '']
              .filter(Boolean)
              .join('\n')
          : trim(raw) || ''
      joinRecords[join][0][fieldName] = val
    }
  }

  return { contactValues, joinRecords }
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

  const { captchaToken, fields: fieldDefs, ...formData } = body as {
    captchaToken?: string
    fields?: AfformField[]
    [key: string]: unknown
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
    const { contactValues, joinRecords } = buildEntityData(formData, fieldDefs)

    const contact = await civiClient.create<{ id: number }>(
      'Contact',
      contactValues
    )
    const contactId = contact.id

    const joinPromises: Promise<unknown>[] = []

    if (joinRecords.Email?.[0]?.email) {
      joinPromises.push(
        civiClient.create('Email', {
          contact_id: contactId,
          is_primary: true,
          ...joinRecords.Email[0],
        })
      )
    }

    if (joinRecords.Address?.[0]?.city) {
      joinPromises.push(
        civiClient.create('Address', {
          contact_id: contactId,
          location_type_id: 3,
          ...joinRecords.Address[0],
        })
      )
    }

    const websites = (joinRecords.Website ?? []).filter((r) => r.url)
    for (const rec of websites) {
      joinPromises.push(
        civiClient.create('Website', { contact_id: contactId, ...rec })
      )
    }

    const ims = (joinRecords.IM ?? []).filter((r) => r.name)
    for (const rec of ims) {
      joinPromises.push(
        civiClient.create('IM', {
          contact_id: contactId,
          provider_id: rec.provider_id || 5,
          ...rec,
        })
      )
    }

    if (joinRecords.Note?.[0]?.note) {
      joinPromises.push(
        civiClient.create('Note', {
          entity_table: 'civicrm_contact',
          entity_id: contactId,
          ...joinRecords.Note[0],
        })
      )
    }

    await Promise.allSettled(joinPromises)

    let caseId: number | null = null
    try {
      const caseRecord = await civiClient.create<{ id: number }>('Case', {
        case_type_id: CASE_TYPE_ID,
        status_id: CASE_STATUS_ID,
        contact_id: contactId,
        subject: `Circle Onboarding - ${String(contactValues.first_name || 'New Contact')}`,
      })
      caseId = caseRecord.id
    } catch {
      // Case creation failure is non-fatal — contact was already created
    }

    return NextResponse.json(
      { success: true, contactId, caseId },
      { status: 201 }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to submit form. Please try again.', detail: message },
      { status: 502 }
    )
  }
}
