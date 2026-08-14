import { z } from 'zod/v4'

import {
  createPrivacyRequestSchema,
  setDoNotContactSchema,
} from '@/contracts/privacy'
import { apiError, apiException } from '@/server/api-response'
import { resolveActor } from '@/server/auth'
import {
  anonymisePerson,
  createPrivacyRequest,
  getPrivacyState,
  setDoNotContact,
} from '@/server/privacy-repository'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Extended rather than intersected: a discriminated union needs each member to
// be a plain object shape, and an intersection is not one.
const actionSchema = z.discriminatedUnion('action', [
  setDoNotContactSchema.extend({ action: z.literal('suppression') }),
  createPrivacyRequestSchema.extend({ action: z.literal('request') }),
  z.object({ action: z.literal('anonymise') }),
])

export async function GET(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    await resolveActor(request)
    const { id } = await context.params
    z.string().uuid().parse(id)
    return Response.json({ item: await getPrivacyState(id) })
  } catch (error) {
    return apiException(error)
  }
}

export async function POST(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const actor = await resolveActor(request)
    const { id } = await context.params
    z.string().uuid().parse(id)
    const input = actionSchema.parse(await request.json())

    if (input.action === 'suppression') {
      return Response.json({
        item: await setDoNotContact(actor, id, input),
      })
    }

    if (input.action === 'request') {
      return Response.json({
        item: await createPrivacyRequest(actor, id, input),
      })
    }

    if (input.action === 'anonymise') {
      return Response.json({ item: await anonymisePerson(actor, id) })
    }

    return apiError('VALIDATION_ERROR', 'Unsupported action.', 400)
  } catch (error) {
    return apiException(error)
  }
}
