import { z } from 'zod/v4'

import { activityTypes, taskPriorities, taskStatuses } from '@/server/db/schema'

export const workSubjectTypes = ['case', 'person', 'organisation'] as const

export const workSubjectTypeSchema = z.enum(workSubjectTypes)
export const activityTypeSchema = z.enum(activityTypes)
export const taskStatusSchema = z.enum(taskStatuses)
export const taskPrioritySchema = z.enum(taskPriorities)

export const workListQuerySchema = z.object({
  subjectType: workSubjectTypeSchema,
  subjectId: z.string().uuid(),
})

export const createActivitySchema = workListQuerySchema.extend({
  type: activityTypeSchema.default('note'),
  body: z.string().trim().min(1).max(2_000),
  occurredAt: z.string().datetime().optional(),
  createdBy: z.string().trim().min(2).max(100),
})

export const createTaskSchema = workListQuerySchema.extend({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(1_000).optional(),
  priority: taskPrioritySchema.default('medium'),
  assignee: z.string().trim().min(2).max(100),
  dueAt: z.string().datetime(),
})

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(2).max(180).optional(),
    description: z.string().trim().max(1_000).nullable().optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    assignee: z.string().trim().min(2).max(100).optional(),
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
  createdBy: z.string(),
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
  assignee: z.string(),
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
export type WorkListQuery = z.infer<typeof workListQuerySchema>
export type WorkSubjectType = z.infer<typeof workSubjectTypeSchema>
