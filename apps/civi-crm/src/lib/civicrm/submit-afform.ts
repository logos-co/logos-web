import { isAfformIntakeFormName } from './afform-case-defaults'
import {
  buildAfformValues,
  type AfformFieldDef,
} from './build-afform-values'

export type CiviCrmSubmitResult =
  | { ok: true }
  | { ok: false; message: string }

export async function submitToCiviCrm(
  formData: Record<string, unknown>,
  fieldDefs: AfformFieldDef[],
  formName: string
): Promise<CiviCrmSubmitResult> {
  const baseUrl = process.env.CIVICRM_BASE_URL ?? ''
  const apiKey = process.env.CIVICRM_API_KEY ?? ''

  if (!baseUrl || !apiKey) {
    return { ok: false, message: 'CiviCRM is not configured' }
  }

  try {
    const values = buildAfformValues(
      formData,
      fieldDefs,
      isAfformIntakeFormName(formName) ? formName : undefined
    )
    const params = JSON.stringify({ name: formName, values, args: {} })

    const res = await fetch(
      `${baseUrl}/civicrm/ajax/api4/Afform/submit`,
      {
        method: 'POST',
        headers: {
          'X-Civi-Auth': `Bearer ${apiKey}`,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `params=${encodeURIComponent(params)}`,
      }
    )

    if (!res.ok) {
      const text = await res.text()
      return {
        ok: false,
        message: `Afform.submit (${res.status}): ${text.slice(0, 200)}`,
      }
    }

    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return { ok: false, message }
  }
}
