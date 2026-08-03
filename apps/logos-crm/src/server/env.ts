import { z } from 'zod/v4'

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
})

export interface ServerEnv {
  DATABASE_URL: string
}

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
  })
}
