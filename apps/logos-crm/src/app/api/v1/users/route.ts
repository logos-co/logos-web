import { createUserSchema } from '@/contracts/user'
import { apiException } from '@/server/api-response'
import { findOrCreateUser, listAssignableUsers } from '@/server/user-repository'

export async function GET(): Promise<Response> {
  try {
    const items = await listAssignableUsers()
    return Response.json({ items })
  } catch (error) {
    return apiException(error)
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const input = createUserSchema.parse(await request.json())
    return Response.json(
      { item: await findOrCreateUser(input) },
      { status: 201 }
    )
  } catch (error) {
    return apiException(error)
  }
}
