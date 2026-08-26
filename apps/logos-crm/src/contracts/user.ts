import { z } from 'zod/v4'

import { authModes, userStatuses } from './values'

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
  authMode: z.enum(authModes),
})

/**
 * Adding a coordinator from wherever work is being assigned.
 *
 * The email is optional because the person doing the assigning knows a name,
 * not necessarily an address. When it is missing one is derived from the name
 * on the house convention, which every seeded account already follows. That is
 * a lookup key rather than an identity - the schema is explicit that identity
 * arrives later as `externalSubject` - so a derived address that turns out to
 * be wrong is corrected, not migrated around.
 */
export const createUserSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  email: z
    .union([z.string().trim().email().max(240), z.literal('')])
    .optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type CurrentActor = z.infer<typeof currentActorSchema>
export type UserRecord = z.infer<typeof userRecordSchema>
export type UserStatus = z.infer<typeof userStatusSchema>
