import { apiException } from '@/server/api-response'
import { listAssignableUsers } from '@/server/user-repository'

export async function GET(): Promise<Response> {
  try {
    const items = await listAssignableUsers()
    return Response.json({ items })
  } catch (error) {
    return apiException(error)
  }
}
