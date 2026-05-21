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

  get<T>(_entity: string, _params: CiviParams): Promise<T[]> {
    throw new Error('Not implemented')
  }

  create<T>(_entity: string, _values: Record<string, unknown>): Promise<T> {
    throw new Error('Not implemented')
  }

  update<T>(
    _entity: string,
    _where: CiviParams['where'],
    _values: Record<string, unknown>
  ): Promise<T[]> {
    throw new Error('Not implemented')
  }

  delete(_entity: string, _where: CiviParams['where']): Promise<void> {
    throw new Error('Not implemented')
  }
}

export const civiClient = new CiviCRMClient()
