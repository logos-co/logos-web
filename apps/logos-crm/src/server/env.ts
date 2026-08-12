import { z } from 'zod/v4'

/**
 * `none` runs the app without a login screen: the acting user is resolved
 * server-side from `CRM_DEV_ACTOR_EMAIL` and the browser cannot influence it.
 * It exists because the Infra identity contract is not settled yet, and it is
 * refused in production — an instance holding real personal data must not be
 * reachable without an identity behind it.
 */
export const authModes = ['none', 'proxy'] as const

const serverEnvSchema = z
  .object({
    DATABASE_URL: z.string().url(),
    AUTH_MODE: z.enum(authModes).default('none'),
    CRM_DEV_ACTOR_EMAIL: z.string().trim().min(3).optional(),
    NODE_ENV: z.string().default('development'),
  })
  .refine((env) => env.NODE_ENV !== 'production' || env.AUTH_MODE !== 'none', {
    message:
      'AUTH_MODE=none cannot be used in production: wire the Infra identity seam first.',
    path: ['AUTH_MODE'],
  })

export type AuthMode = (typeof authModes)[number]

export interface ServerEnv {
  DATABASE_URL: string
  AUTH_MODE: AuthMode
  CRM_DEV_ACTOR_EMAIL?: string
  NODE_ENV: string
}

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_MODE: process.env.AUTH_MODE,
    CRM_DEV_ACTOR_EMAIL: process.env.CRM_DEV_ACTOR_EMAIL,
    NODE_ENV: process.env.NODE_ENV,
  })
}
