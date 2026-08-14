import { z } from 'zod/v4'

/**
 * `none` runs the app without a login screen: the acting user is resolved
 * server-side from `CRM_DEV_ACTOR_EMAIL` and the browser cannot influence it.
 * It exists because the Infra identity contract is not settled yet, and it is
 * refused in production — an instance holding real personal data must not be
 * reachable without an identity behind it.
 */
export const authModes = ['none', 'proxy'] as const

/**
 * Parsing is pure: it describes what is set, never what is allowed.
 *
 * The production guards live where the risk is — resolving an actor, and
 * verifying a captcha — rather than here. Enforcing them at parse time also
 * blocked `next build`, which evaluates route modules on a machine that
 * legitimately has no secrets, so a policy about serving requests became a
 * policy about compiling code.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_MODE: z.enum(authModes).default('none'),
  CRM_DEV_ACTOR_EMAIL: z.string().trim().min(3).optional(),
  HCAPTCHA_SECRET: z.string().trim().min(1).optional(),
  /** Base URL used to build deep links in notifications. */
  CRM_PUBLIC_URL: z.string().url().optional(),
  SMTP_SERVER: z.string().trim().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().trim().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().trim().optional(),
  SMTP_TLS_ENABLE: z.string().trim().optional(),
  NOTION_TOKEN: z.string().trim().min(1).optional(),
  NOTION_INTAKE_DATABASE_ID: z.string().trim().min(1).optional(),
  NODE_ENV: z.string().default('development'),
})

export type AuthMode = (typeof authModes)[number]

export interface ServerEnv {
  DATABASE_URL: string
  AUTH_MODE: AuthMode
  CRM_DEV_ACTOR_EMAIL?: string
  HCAPTCHA_SECRET?: string
  CRM_PUBLIC_URL?: string
  SMTP_SERVER?: string
  SMTP_PORT?: number
  SMTP_USER?: string
  SMTP_PASSWORD?: string
  SMTP_FROM?: string
  SMTP_TLS_ENABLE?: string
  NOTION_TOKEN?: string
  NOTION_INTAKE_DATABASE_ID?: string
  NODE_ENV: string
}

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_MODE: process.env.AUTH_MODE,
    CRM_DEV_ACTOR_EMAIL: process.env.CRM_DEV_ACTOR_EMAIL,
    HCAPTCHA_SECRET: process.env.HCAPTCHA_SECRET,
    CRM_PUBLIC_URL: process.env.CRM_PUBLIC_URL,
    SMTP_SERVER: process.env.SMTP_SERVER,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
    SMTP_TLS_ENABLE: process.env.SMTP_TLS_ENABLE,
    NOTION_TOKEN: process.env.NOTION_TOKEN,
    NOTION_INTAKE_DATABASE_ID: process.env.NOTION_INTAKE_DATABASE_ID,
    NODE_ENV: process.env.NODE_ENV,
  })
}
