import { z } from 'zod/v4'

import { caseDecisions, caseStatuses } from './values'

export const reportBuckets = ['day', 'week', 'month'] as const

export type ReportBucket = (typeof reportBuckets)[number]

function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  } catch {
    return false
  }
}

/**
 * Every report is a question about a cohort seen from a point in time, so all
 * four parameters are required rather than defaulted.
 *
 * `cohort_from`/`cohort_to` select which cases are counted — the ones created in
 * that window. `as_of` decides which state they are counted in: a case created
 * in March and closed in May is open when asked about April. Without an
 * explicit `as_of` a report silently means "now", and two people comparing
 * numbers taken a week apart would be comparing different questions.
 *
 * The timezone decides where a day starts, which changes every bucket boundary
 * and therefore the counts themselves.
 */
export const reportQuerySchema = z
  .object({
    cohortFrom: z.string().datetime(),
    cohortTo: z.string().datetime(),
    asOf: z.string().datetime(),
    timezone: z.string().refine(isValidTimezone, 'Unknown IANA timezone.'),
    bucket: z.enum(reportBuckets).default('week'),
  })
  .refine((value) => new Date(value.cohortFrom) <= new Date(value.cohortTo), {
    message: 'The cohort start must not be after its end.',
    path: ['cohortFrom'],
  })
  .refine((value) => new Date(value.asOf) >= new Date(value.cohortFrom), {
    message: 'as_of cannot precede the cohort start.',
    path: ['asOf'],
  })
  // A future as_of would report a state nothing has reached yet, which reads as
  // data loss rather than as the empty answer it is.
  .refine((value) => new Date(value.asOf) <= new Date(), {
    message: 'as_of cannot be in the future.',
    path: ['asOf'],
  })

export const reportBreakdownSchema = z.object({
  key: z.string(),
  label: z.string(),
  count: z.number().int().nonnegative(),
})

export const reportSchema = z.object({
  cohortTotal: z.number().int().nonnegative(),
  /** Status each cohort case was in at `as_of`, from workflow history. */
  statusAtAsOf: z.array(reportBreakdownSchema),
  decisions: z.array(reportBreakdownSchema),
  /** Owner at `as_of`, from the assignment intervals, with an unassigned bucket. */
  ownersAtAsOf: z.array(reportBreakdownSchema),
  intakeOverTime: z.array(reportBreakdownSchema),
  /**
   * Cohort cases whose history was imported rather than observed. They are
   * counted in the totals but excluded from anything measuring duration,
   * because an imported timestamp records the export, not the decision.
   */
  historyCoverageGap: z.number().int().nonnegative(),
})

export const statusLabelsForReport: Record<
  (typeof caseStatuses)[number],
  string
> = {
  new: 'New',
  in_progress: 'In progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const decisionLabelsForReport: Record<
  (typeof caseDecisions)[number],
  string
> = {
  pending: 'Not decided',
  approved: 'Approved',
  redirected: 'Redirected',
  declined: 'Declined',
}

export type ReportBreakdown = z.infer<typeof reportBreakdownSchema>
export type ReportQuery = z.infer<typeof reportQuerySchema>
export type ReportResult = z.infer<typeof reportSchema>
