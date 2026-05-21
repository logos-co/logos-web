export function getCurrentUserEmail(req: Request): string | null {
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_USER_EMAIL_MOCK)
    return process.env.DEV_USER_EMAIL_MOCK
  return req.headers.get(
    process.env.KEYCLOAK_USER_EMAIL_HEADER ?? 'x-auth-request-email'
  )
}
