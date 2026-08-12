import type { CurrentActor } from '@/contracts/user'
import { apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import { getServerEnv } from '@/server/env'

export async function GET(request: Request): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    const item: CurrentActor = {
      id: actor.userId,
      displayName: actor.displayName,
      email: actor.email,
      authMode: getServerEnv().AUTH_MODE,
    }
    return Response.json({ item })
  } catch (error) {
    return apiException(error)
  }
}
