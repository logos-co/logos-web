import { eq } from 'drizzle-orm'

import { db } from '@/server/db'
import { users } from '@/server/db/schema'
import { getServerEnv, type AuthMode } from '@/server/env'

/**
 * The identity seam. Every service takes an `ActorContext` rather than reading
 * a user from request data, so wiring real authentication later means changing
 * this file and nothing else. Nothing in here may accept an actor supplied by
 * the browser: request bodies, query parameters, and cookies are all attacker
 * controlled once the app is reachable.
 */
export interface ActorContext {
  userId: string
  email: string
  displayName: string
  /** Correlates audit events with the request that caused them. */
  requestId: string
}

export class AuthError extends Error {
  constructor(
    readonly code: 'UNAUTHENTICATED' | 'USER_PENDING_APPROVAL' | 'FORBIDDEN',
    message: string
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

const DEFAULT_DEV_ACTOR_EMAIL = 'mara.chen@logos.co'

function readRequestId(request?: Request): string {
  const header = request?.headers.get('x-request-id')?.trim()
  if (header) return header.slice(0, 120)
  return crypto.randomUUID()
}

async function resolveDevActor(
  requestId: string,
  mode: AuthMode
): Promise<ActorContext> {
  const { CRM_DEV_ACTOR_EMAIL, NODE_ENV } = getServerEnv()

  // Checked when a request is actually served, not when the module loads. An
  // instance holding real personal data must not answer without an identity
  // behind it, but a build machine has no secrets and serves nobody.
  //
  // `demo` is exempt: it is the operator saying this instance holds fixtures
  // and nothing else, which is a claim `none` never made.
  if (NODE_ENV === 'production' && mode !== 'demo') {
    throw new AuthError(
      'FORBIDDEN',
      'AUTH_MODE=none cannot serve requests in production: wire the Infra identity seam first.'
    )
  }
  const email = normaliseEmail(CRM_DEV_ACTOR_EMAIL ?? DEFAULT_DEV_ACTOR_EMAIL)

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.normalisedEmail, email))
    .limit(1)

  if (!user) {
    throw new AuthError(
      'UNAUTHENTICATED',
      `No CRM user matches CRM_DEV_ACTOR_EMAIL (${email}). Run "pnpm --filter logos-crm db:seed" or set the variable to a seeded user.`
    )
  }

  if (user.status !== 'active') {
    throw new AuthError(
      user.status === 'pending' ? 'USER_PENDING_APPROVAL' : 'FORBIDDEN',
      'The configured development actor is not an active user.'
    )
  }

  return {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    requestId,
  }
}

/**
 * Resolves the acting user for a request.
 *
 * `AUTH_MODE=proxy` is the shape the Infra deployment will use — trusted
 * subject and email headers plus a shared verification header, resolved to a
 * local user by immutable subject. It is deliberately not implemented yet
 * rather than stubbed permissively: a seam that silently admits everyone is
 * worse than one that refuses to start.
 */
export async function resolveActor(request?: Request): Promise<ActorContext> {
  const requestId = readRequestId(request)
  const { AUTH_MODE } = getServerEnv()

  if (AUTH_MODE === 'none' || AUTH_MODE === 'demo') {
    return resolveDevActor(requestId, AUTH_MODE)
  }

  throw new AuthError(
    'UNAUTHENTICATED',
    'AUTH_MODE=proxy is not implemented: the Infra identity header contract is not settled yet.'
  )
}
