import { buildN8nPayload } from './build-payload'
import { N8N_STEWARD_WEBHOOK_URL } from './constants'

export type N8nSubmitResult = { ok: true } | { ok: false; message: string }

// Forwards a steward application to the Circles n8n/Baserow webhook. The auth
// token is a server-only deployment secret; when it is unset the push is
// skipped (the caller treats this as best-effort and never blocks the user).
// Never throws: all failures are returned as { ok: false }.
export async function submitToN8n(
  formData: Record<string, unknown>,
  formName: string
): Promise<N8nSubmitResult> {
  const token = process.env.N8N_STEWARD_WEBHOOK_TOKEN ?? ''

  if (!token) {
    return { ok: false, message: 'n8n webhook is not configured' }
  }

  try {
    const res = await fetch(N8N_STEWARD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': token,
      },
      body: JSON.stringify(buildN8nPayload(formData, formName)),
    })

    if (!res.ok) {
      const text = await res.text()
      return {
        ok: false,
        message: `n8n webhook (${res.status}): ${text.slice(0, 200)}`,
      }
    }

    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return { ok: false, message }
  }
}
