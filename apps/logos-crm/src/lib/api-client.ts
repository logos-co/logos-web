interface ApiErrorPayload {
  error?: {
    code?: string
    message?: string
  }
}

export class ApiClientError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
  }
}

export async function apiClient<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  const payload = (await response.json()) as T | ApiErrorPayload
  if (!response.ok) {
    const error = (payload as ApiErrorPayload).error
    throw new ApiClientError(
      error?.message ?? 'The request could not be completed.',
      error?.code ?? 'UNKNOWN_ERROR',
      response.status
    )
  }

  return payload as T
}
