import type { CiviResponse } from './types'

// null is valid as the third element for operators that take no value (e.g. 'IS NULL', 'IS NOT NULL').
export type CiviWhere = [string, string, string | number | null]

export type CiviParams = {
  select?: string[]
  where?: CiviWhere[]
  values?: Record<string, unknown>
  limit?: number
  offset?: number
}

export class CiviCRMError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'CiviCRMError'
  }
}

// Thin fetch wrapper around CiviCRM APIv4.
// All CiviCRM HTTP calls must go through this class — never call CiviCRM directly from route handlers.
export class CiviCRMClient {
  constructor(
    private readonly baseUrl: string = process.env.CIVICRM_BASE_URL ?? '',
    private readonly apiKey: string = process.env.CIVICRM_API_KEY ?? ''
  ) {}

  private get authHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Civi-Auth': `Bearer ${this.apiKey}`,
    }
  }

  async get<T>(entity: string, params: CiviParams): Promise<T[]> {
    const url = `${this.baseUrl}/civicrm/ajax/api4/${entity}/get`
    const res = await fetch(url, {
      method: 'POST',
      headers: this.authHeaders,
      body: JSON.stringify(params),
    })
    if (!res.ok) throw new CiviCRMError(res.status, await res.text())
    const data: CiviResponse<T> = await res.json()
    return data.values
  }

  async create<T>(entity: string, values: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}/civicrm/ajax/api4/${entity}/create`
    const res = await fetch(url, {
      method: 'POST',
      headers: this.authHeaders,
      body: JSON.stringify({ values }),
    })
    if (!res.ok) throw new CiviCRMError(res.status, await res.text())
    const data: CiviResponse<T> = await res.json()
    const record = data.values[0]
    if (record === undefined)
      throw new CiviCRMError(200, 'create returned empty values')
    return record
  }

  async update<T>(
    entity: string,
    where: CiviParams['where'],
    values: Record<string, unknown>
  ): Promise<T[]> {
    const url = `${this.baseUrl}/civicrm/ajax/api4/${entity}/update`
    const res = await fetch(url, {
      method: 'POST',
      headers: this.authHeaders,
      body: JSON.stringify({ where, values }),
    })
    if (!res.ok) throw new CiviCRMError(res.status, await res.text())
    const data: CiviResponse<T> = await res.json()
    return data.values
  }

  async delete(entity: string, where: CiviParams['where']): Promise<void> {
    const url = `${this.baseUrl}/civicrm/ajax/api4/${entity}/delete`
    const res = await fetch(url, {
      method: 'POST',
      headers: this.authHeaders,
      body: JSON.stringify({ where }),
    })
    if (!res.ok) throw new CiviCRMError(res.status, await res.text())
  }
}

export const civiClient = new CiviCRMClient()
