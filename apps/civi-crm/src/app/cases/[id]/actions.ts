'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

async function patchRoute(path: string, body: unknown): Promise<void> {
  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'localhost:3012'
  const proto = hdrs.get('x-forwarded-proto') ?? 'http'
  const authHeaderName =
    process.env.KEYCLOAK_USER_EMAIL_HEADER ?? 'x-auth-request-email'
  const reqHeaders: Record<string, string> = {
    'content-type': 'application/json',
  }
  const email = hdrs.get(authHeaderName)
  if (email) reqHeaders[authHeaderName] = email

  const res = await fetch(`${proto}://${host}${path}`, {
    method: 'PATCH',
    headers: reqHeaders,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    let msg = String(res.status)
    try {
      const j: { error?: string } = await res.json()
      if (j.error) msg = j.error
    } catch {
      // ignore parse failures
    }
    throw new Error(`PATCH ${path} failed: ${msg}`)
  }
}

export async function updateCase(
  caseId: string,
  fields: Record<string, unknown>
): Promise<void> {
  await patchRoute(`/api/cases/${caseId}`, fields)
  revalidatePath('/cases')
  revalidatePath(`/cases/${caseId}`)
}

export async function updateContact(
  contactId: string,
  fields: Record<string, unknown>,
  caseId?: string
): Promise<void> {
  await patchRoute(`/api/contacts/${contactId}`, fields)
  revalidatePath('/cases')
  if (caseId) revalidatePath(`/cases/${caseId}`)
}

export async function swapCoordinator(
  caseId: string,
  newCoordinatorContactId: string
): Promise<void> {
  await patchRoute(`/api/cases/${caseId}/coordinator`, {
    newCoordinatorContactId,
  })
  revalidatePath('/cases')
  revalidatePath(`/cases/${caseId}`)
}
