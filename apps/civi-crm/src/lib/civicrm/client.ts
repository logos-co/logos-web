import type { CiviResponse } from './types'

// null is valid as the third element for operators that take no value (e.g. 'IS NULL', 'IS NOT NULL').
// Array form is used for 'IN' / 'NOT IN' operators: ['id', 'IN', [1, 2, 3]]
export type CiviWhereValue = boolean | number | string | null

export type CiviWhere = [string, string, CiviWhereValue | CiviWhereValue[]]

export type CiviParams = {
  select?: string[]
  where?: CiviWhere[]
  orderBy?: [string, 'ASC' | 'DESC'][]
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

  private get isDebug() {
    return process.env.LOG_LEVEL?.toLowerCase() === 'debug'
  }

  private async request(url: string, body: string): Promise<Response> {
    if (this.isDebug) {
      console.debug(`[CiviCRM] → POST ${url}\n            ${body}`)
    }
    const start = Date.now()
    const res = await fetch(url, {
      method: 'POST',
      headers: this.authHeaders,
      body,
    })
    if (this.isDebug) {
      const responseBody = await res.clone().text()
      console.debug(
        `[CiviCRM] ← ${res.status} ${url} (${Date.now() - start}ms)\n            ${responseBody}`
      )
    }
    return res
  }

  async get<T>(entity: string, params: CiviParams): Promise<T[]> {
    const url = `${this.baseUrl}/civicrm/ajax/api4/${entity}/get`
    const res = await this.request(url, JSON.stringify(params))
    if (!res.ok) throw new CiviCRMError(res.status, await res.text())
    const data: CiviResponse<T> = await res.json()
    return data.values
  }

  async create<T>(entity: string, values: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}/civicrm/ajax/api4/${entity}/create`
    const res = await this.request(url, JSON.stringify({ values }))
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
    const res = await this.request(url, JSON.stringify({ where, values }))
    if (!res.ok) throw new CiviCRMError(res.status, await res.text())
    const data: CiviResponse<T> = await res.json()
    return data.values
  }

  async delete(entity: string, where: CiviParams['where']): Promise<void> {
    const url = `${this.baseUrl}/civicrm/ajax/api4/${entity}/delete`
    const res = await this.request(url, JSON.stringify({ where }))
    if (!res.ok) throw new CiviCRMError(res.status, await res.text())
  }

  async count(
    entity: string,
    params: Pick<CiviParams, 'where'>
  ): Promise<number> {
    const url = `${this.baseUrl}/civicrm/ajax/api4/${entity}/get`
    // row_count is an aggregate pseudo-field: the API returns a single record
    // { row_count: N } without fetching any entity rows.
    const res = await this.request(
      url,
      JSON.stringify({ select: ['row_count'], where: params.where })
    )
    if (!res.ok) throw new CiviCRMError(res.status, await res.text())
    const data: CiviResponse<{ row_count: number }> = await res.json()
    return data.values[0]?.row_count ?? 0
  }
}

export const civiClient = new CiviCRMClient()
