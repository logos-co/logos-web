import { z } from 'zod/v4'

import { workActorSchema, workSubjectTypeSchema } from './work'

/**
 * One chronological history for a record.
 *
 * The pieces already existed and were each shown somewhere else: notes and
 * tasks behind their own tabs, stage and status changes only in the database,
 * decisions only on the decision panel. "What has happened with this partner"
 * was a question you answered by reading three panels and inferring the order.
 *
 * This is a read model over those tables, not a new one. Nothing writes here:
 * the entry types below are projections, so a timeline can never disagree with
 * the records it summarises.
 */
export const timelineEntryKinds = [
  'note',
  'contact',
  'task_opened',
  'task_completed',
  'stage_changed',
  'status_changed',
  'decision',
  'assignment',
] as const

export type TimelineEntryKind = (typeof timelineEntryKinds)[number]

export const timelineEntrySchema = z.object({
  /** Stable within a subject, so React keys survive a refetch. */
  id: z.string(),
  kind: z.enum(timelineEntryKinds),
  occurredAt: z.string().datetime(),
  /** One line naming what happened. Never the note body. */
  summary: z.string(),
  /** Markdown, present only for notes. */
  body: z.string().nullable(),
  actor: workActorSchema.nullable(),
  /** Set for note entries so they stay editable from the timeline. */
  activityId: z.string().uuid().nullable(),
  editedAt: z.string().datetime().nullable(),
  isDeleted: z.boolean(),
})

export const timelineQuerySchema = z.object({
  subjectType: workSubjectTypeSchema,
  subjectId: z.string().uuid(),
})

export type TimelineEntry = z.infer<typeof timelineEntrySchema>
export type TimelineQuery = z.infer<typeof timelineQuerySchema>
