import { headers } from 'next/headers'

/**
 * Returns the absolute base URL of the running Next.js app, derived from the
 * incoming request's Host / x-forwarded-proto headers.
 *
 * Used by Server Components and Server Actions that need to call the app's own
 * API routes via HTTP (the only way to use those routes server-side, since
 * relative URLs are not supported in server-side fetch).
 */
export async function getBaseUrl(): Promise<string> {
  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'localhost:3002'
  const proto = hdrs.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}
