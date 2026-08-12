import { ZodError } from 'zod/v4'

import { AuthError } from '@/server/auth'
import { ServiceError } from '@/server/service-errors'

interface ApiErrorBody {
  error: {
    code: string
    message: string
    fields?: Record<string, string>
  }
}

function getDatabaseErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null
  if ('code' in error && typeof error.code === 'string') return error.code
  if ('cause' in error) return getDatabaseErrorCode(error.cause)
  return null
}

export function apiError(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string>
): Response {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(fields ? { fields } : {}),
    },
  }

  return Response.json(body, { status })
}

export function apiException(error: unknown): Response {
  if (error instanceof ServiceError) {
    return apiError(error.code, error.message, error.status, error.fields)
  }

  if (error instanceof AuthError) {
    const status = error.code === 'UNAUTHENTICATED' ? 401 : 403
    return apiError(error.code, error.message, status)
  }

  if (error instanceof ZodError) {
    const fields = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join('.'), issue.message])
    )
    return apiError(
      'VALIDATION_ERROR',
      'One or more fields are invalid.',
      400,
      fields
    )
  }

  const databaseErrorCode = getDatabaseErrorCode(error)

  if (databaseErrorCode === '23505') {
    return apiError(
      'DUPLICATE_RECORD',
      'A record with the same unique details already exists.',
      409
    )
  }

  if (databaseErrorCode === '23503') {
    return apiError(
      'RELATED_RECORD_NOT_FOUND',
      'A selected related record no longer exists.',
      400
    )
  }

  return apiError('INTERNAL_ERROR', 'The request could not be completed.', 500)
}
