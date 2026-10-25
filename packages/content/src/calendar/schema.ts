import { z } from 'zod'

export const calendarResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(
    z.object({
      id: z.number().int(),
      date: z.string().date(),
      time: z.string().nullable().optional(),
      type: z.object({ label: z.string(), value: z.string() }),
      guest: z.string().nullable(),
      speakers: z.array(z.string().nullable()),
      topic: z.string().nullable(),
      notes: z.string().nullable(),
      links: z.array(z.string()).optional(),
    })
  ),
})

export type CalendarEvent = z.infer<
  typeof calendarResponseSchema
>['data'][number]
