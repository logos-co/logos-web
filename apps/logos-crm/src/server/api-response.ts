import { ZodError } from 'zod/v4'

interface ApiErrorBody {
  error: {
    code: string
    message: string
    fields?: Record<string, string>
  }
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

  return apiError('INTERNAL_ERROR', 'The request could not be completed.', 500)
}
