import { HEAR_ABOUT_MAP, HEAR_ABOUT_QUESTION } from '@repo/funnel'

import { intakeSubmissionSchema } from '@/contracts/intake'
import { apiError, apiException } from '@/server/api-response'
import { readClientIp, verifyCaptcha } from '@/server/captcha'
import {
  processSubmission,
  recordSubmission,
  recordSubmissionFailure,
} from '@/server/intake-repository'

/**
 * Public funnel intake. This is the only unauthenticated route in the app.
 *
 * The website posts the form's own keys, so the payload is normalised here
 * rather than asking `apps/web` to learn a second shape. Delivery to Notion or
 * n8n is deliberately not done inline: once this endpoint is canonical, those
 * become worker follow-ups, and a downstream outage must not cost an applicant.
 */

interface IntakeBody {
  formName?: string
  submissionId?: string
  captchaToken?: string
  [key: string]: unknown
}

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const found = value.find((entry) => typeof entry === 'string')
    return typeof found === 'string' ? found : undefined
  }
  return undefined
}

/**
 * The form posts the option id of the "How did you first hear about Logos?"
 * select. Store the label: an id is meaningless in a report, and the option
 * list is owned by `@repo/funnel`.
 */
function resolveHearAbout(value: unknown): string | undefined {
  const raw = firstString(value)
  if (!raw) return undefined
  return HEAR_ABOUT_MAP[raw] ?? raw
}

function normaliseBody(body: Readonly<IntakeBody>) {
  const background =
    firstString(body.backgroundPartner) ??
    firstString(body.backgroundBuilder) ??
    firstString(body.backgroundLeader)

  return {
    submissionId: body.submissionId,
    formName: body.formName,
    name: firstString(body.name),
    email: firstString(body.email),
    city: firstString(body.city),
    country: firstString(body.country),
    skills: firstString(body.skills),
    affiliatedOrgs: firstString(body.affiliatedOrgs),
    website: body.website,
    chat: body.chat,
    chatService: firstString(body.chatService),
    hearAbout: resolveHearAbout(body[HEAR_ABOUT_QUESTION]),
    techVision: firstString(body.techVision),
    activitiesVision: firstString(body.activitiesVision),
    background,
    questions: firstString(body.questions),
    wantsNewsletter: body.wantsNewsletter,
    wantsEvents: body.wantsEvents,
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: IntakeBody
  try {
    body = (await request.json()) as IntakeBody
  } catch {
    return apiError(
      'VALIDATION_ERROR',
      'The request body is not valid JSON.',
      400
    )
  }

  const requestId =
    request.headers.get('x-request-id')?.slice(0, 120) ?? crypto.randomUUID()

  let input
  try {
    input = intakeSubmissionSchema.parse(normaliseBody(body))
  } catch (error) {
    return apiException(error)
  }

  // Checked before anything is written. Verifying after storing would leave a
  // spam run with a table full of submissions to clean up, which is most of
  // what this is here to prevent.
  const captcha = await verifyCaptcha(body.captchaToken, readClientIp(request))
  if (!captcha.ok) {
    // An outage of the verifier is not a rejected human, so it gets a retryable
    // status rather than a refusal the visitor cannot act on.
    return captcha.reason === 'unavailable'
      ? apiError(
          'CAPTCHA_UNAVAILABLE',
          'The captcha service could not be reached. Please try again.',
          503
        )
      : apiError('CAPTCHA_FAILED', 'Captcha verification failed.', 403)
  }

  // Store first, map second. The stored payload is the applicant; everything
  // after this point can be retried without asking them to submit again.
  const submission = await recordSubmission(input, body)

  try {
    const result = await processSubmission(submission, input, requestId)
    return Response.json(
      { item: result },
      { status: result.duplicate ? 200 : 201 }
    )
  } catch (error) {
    await recordSubmissionFailure(
      input.submissionId,
      error instanceof Error ? error.message : 'Unknown mapping failure'
    )
    // The submission is safely stored and replayable, so the visitor is told it
    // was received rather than being asked to resubmit into a broken mapping.
    return Response.json(
      {
        item: {
          submissionId: input.submissionId,
          caseId: null,
          personId: null,
          duplicate: false,
        },
      },
      { status: 202 }
    )
  }
}
