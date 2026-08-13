import { z } from 'zod/v4'

/**
 * The three funnel forms on `apps/web`. The names are the wire values the form
 * already posts, so the CRM endpoint is a drop-in replacement for the one in
 * `apps/civi-crm` rather than a new contract the website has to learn.
 */
export const intakeFormNames = [
  'afformCoalitionPartner',
  'afformActivistBuilder',
  'afformActivistLeaderSteward',
] as const

export type IntakeFormName = (typeof intakeFormNames)[number]

/** Human-readable funnel label stored on the case as its profile. */
export const intakeProfileByForm: Record<IntakeFormName, string> = {
  afformCoalitionPartner: 'Coalition Partner',
  afformActivistBuilder: 'Activist Builder',
  afformActivistLeaderSteward: 'Activist Leader / Steward',
}

const repeatableText = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (value === undefined) return []
    const values = Array.isArray(value) ? value : [value]
    return values.map((entry) => entry.trim()).filter(Boolean)
  })

const checkbox = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => value === true || value === 'true' || value === '1')

/**
 * Only `name` is structurally required. The forms mark more fields required in
 * the browser, but this endpoint's job is to not lose an applicant: a
 * submission that reaches the server with a gap is a case to triage, not a
 * request to reject.
 */
export const intakeSubmissionSchema = z.object({
  submissionId: z.string().trim().min(8).max(200),
  formName: z.enum(intakeFormNames),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().max(320).optional(),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  skills: z.string().trim().max(2_000).optional(),
  affiliatedOrgs: z.string().trim().max(200).optional(),
  website: repeatableText,
  chat: repeatableText,
  chatService: z.string().trim().max(120).optional(),
  hearAbout: z.string().trim().max(200).optional(),
  techVision: z.string().trim().max(5_000).optional(),
  activitiesVision: z.string().trim().max(5_000).optional(),
  background: z.string().trim().max(5_000).optional(),
  questions: z.string().trim().max(5_000).optional(),
  wantsNewsletter: checkbox,
  wantsEvents: checkbox,
})

export type IntakeSubmissionInput = z.infer<typeof intakeSubmissionSchema>

export const intakeResultSchema = z.object({
  submissionId: z.string(),
  caseId: z.string().uuid().nullable(),
  personId: z.string().uuid().nullable(),
  /** True when this submission had already been processed before. */
  duplicate: z.boolean(),
})

export type IntakeResult = z.infer<typeof intakeResultSchema>
