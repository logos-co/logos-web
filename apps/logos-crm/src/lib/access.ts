import { createHash, timingSafeEqual } from 'node:crypto'

export interface AccessInput {
  authorization: string | null
  token: string | undefined
  nodeEnv: string | undefined
}

function sameSecret(candidate: string, token: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest()
  return timingSafeEqual(digest(candidate), digest(token))
}

function presentedSecret(authorization: string): string | null {
  const [scheme, value] = authorization.trim().split(/\s+/, 2)
  if (!value) return null
  if (scheme.toLowerCase() === 'bearer') return value
  if (scheme.toLowerCase() !== 'basic') return null
  const decoded = Buffer.from(value, 'base64').toString('utf8')
  const separator = decoded.indexOf(':')
  return separator === -1 ? null : decoded.slice(separator + 1)
}

export function isAuthorised({
  authorization,
  token,
  nodeEnv,
}: Readonly<AccessInput>): boolean {
  if (!token) return nodeEnv === 'development'
  if (!authorization) return false
  const secret = presentedSecret(authorization)
  return secret !== null && sameSecret(secret, token)
}
