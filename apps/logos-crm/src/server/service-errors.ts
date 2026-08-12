/**
 * Errors that carry an API contract. Services throw these so Route Handlers do
 * not have to re-derive a status code from a business condition, and so the
 * same rule produces the same response wherever it is enforced.
 */
export class ServiceError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string>
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

export function notFound(message: string): ServiceError {
  return new ServiceError('NOT_FOUND', message, 404)
}

/** A stale edit: the caller's version no longer matches the stored row. */
export function conflict(message: string): ServiceError {
  return new ServiceError('CONFLICT', message, 409)
}

export function invalidTransition(
  message: string,
  fields?: Record<string, string>
): ServiceError {
  return new ServiceError('VALIDATION_ERROR', message, 400, fields)
}
