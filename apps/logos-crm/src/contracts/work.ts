import { z } from 'zod/v4'

import { activityTypes, taskPriorities, taskStatuses } from './values'

export const workSubjectTypes = ['case', 'person', 'organisation'] as const

export const workSubjectTypeSchema = z.enum(workSubjectTypes)
export const activityTypeSchema = z.enum(activityTypes)
export const taskStatusSchema = z.enum(taskStatuses)
export const taskPrioritySchema = z.enum(taskPriorities)

export const workListQuerySchema = z.object({
  subjectType: workSubjectTypeSchema,
  subjectId: z.string().uuid(),
})

export const workActorSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
})

/**
 * The author is never accepted from the request: it comes from the resolved
 * actor. A client-supplied author is an unauthenticated claim, and an audit
 * trail built on it says only what the caller wanted it to say.
 */
export const createActivitySchema = workListQuerySchema.extend({
  type: activityTypeSchema.default('note'),
  body: z.string().trim().min(1).max(2_000),
  occurredAt: z.string().datetime().optional(),
})

export const createTaskSchema = workListQuerySchema.extend({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(1_000).optional(),
  priority: taskPrioritySchema.default('medium'),
  assigneeUserId: z.string().uuid().optional(),
  dueAt: z.string().datetime(),
})

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(2).max(180).optional(),
    description: z.string().trim().max(1_000).nullable().optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    assigneeUserId: z.string().uuid().nullable().optional(),
    dueAt: z.string().datetime().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update.',
  })

export const activityRecordSchema = z.object({
  id: z.string().uuid(),
  subjectType: workSubjectTypeSchema,
  subjectId: z.string().uuid(),
  type: activityTypeSchema,
  body: z.string(),
  occurredAt: z.string().datetime(),
  createdBy: workActorSchema,
  createdAt: z.string().datetime(),
})

export const taskRecordSchema = z.object({
  id: z.string().uuid(),
  subjectType: workSubjectTypeSchema,
  subjectId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  assignee: workActorSchema.nullable(),
  dueAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type ActivityRecord = z.infer<typeof activityRecordSchema>
export type ActivityType = z.infer<typeof activityTypeSchema>
export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type TaskPriority = z.infer<typeof taskPrioritySchema>
export type TaskRecord = z.infer<typeof taskRecordSchema>
export type TaskStatus = z.infer<typeof taskStatusSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type WorkActor = z.infer<typeof workActorSchema>

/** Activity types that count as contact with the record for staleness. */
export const contactActivityTypes = ['call', 'email', 'meeting'] as const

export function isContactActivity(type: ActivityType): boolean {
  return (contactActivityTypes as ReadonlyArray<ActivityType>).includes(type)
}
export type WorkListQuery = z.infer<typeof workListQuerySchema>
export type WorkSubjectType = z.infer<typeof workSubjectTypeSchema>
