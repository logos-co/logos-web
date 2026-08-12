import { z } from 'zod/v4'

import { userStatuses } from './values'

export const userStatusSchema = z.enum(userStatuses)

export const userRecordSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  email: z.string(),
  status: userStatusSchema,
})

/**
 * Who the server resolved this request as. `authMode` is surfaced so the UI can
 * say plainly that nobody is authenticated, instead of presenting a fixed demo
 * user as if it were a login.
 */
export const currentActorSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  email: z.string(),
  authMode: z.enum(['none', 'proxy']),
})

export type CurrentActor = z.infer<typeof currentActorSchema>
export type UserRecord = z.infer<typeof userRecordSchema>
export type UserStatus = z.infer<typeof userStatusSchema>
