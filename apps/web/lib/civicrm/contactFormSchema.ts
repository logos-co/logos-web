import { z } from 'zod'

import type { AfformField } from './types'

const ALWAYS_REQUIRED = ['email']

const stringOrArray = z.union([z.string(), z.array(z.string())])

const MULTI_RECORD_JOINS = new Set(['Website', 'IM'])

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item))
  if (value == null || value === '') return ['']
  return [String(value)]
}

function isMultiSelect(field: AfformField) {
  return field.inputType === 'select' && !field.join
}

function isRepeatable(field: AfformField) {
  return (
    field.repeatable ||
    (field.join != null && MULTI_RECORD_JOINS.has(field.join))
  )
}

function buildFieldSchema(
  field: AfformField,
  requiredFields: Set<string>
) {
  const { formKey, inputType } = field
  const isReq = requiredFields.has(formKey)

  if (inputType === 'checkbox') return z.boolean().optional().default(true)
  if (inputType === 'hidden') return z.any().optional()

  if (inputType === 'email') {
    if (isReq) return z.string().trim().email('A valid email is required')
    return z
      .string()
      .trim()
      .refine((v) => !v || z.string().email().safeParse(v).success, {
        message: 'A valid email is required',
      })
      .optional()
      .default('')
  }

  if (isMultiSelect(field)) {
    const msg = `${field.label || formKey} is required`
    if (isReq) {
      return stringOrArray
        .transform((v) =>
          (Array.isArray(v) ? v : [v])
            .map((s) => String(s).trim())
            .filter(Boolean)
        )
        .pipe(z.array(z.string()).min(1, msg))
    }
    return stringOrArray.optional().default([])
  }

  if (isRepeatable(field)) {
    return stringOrArray
      .transform((v) =>
        (Array.isArray(v) ? v : v ? [v] : []).map((s) => String(s).trim())
      )
      .pipe(z.array(z.string()).optional().default([]))
  }

  if (inputType === 'select' && field.join) {
    return stringOrArray.optional().default([])
  }

  const msg = `${field.label || formKey} is required`
  return isReq
    ? z.string().trim().min(1, msg)
    : z.string().trim().optional().default('')
}

export function buildFormSchema(
  fields: AfformField[],
  alwaysRequired: string[] = ALWAYS_REQUIRED
) {
  const requiredFields = new Set([
    ...fields.filter((f) => f.required).map((f) => f.formKey),
    ...alwaysRequired,
  ])

  const schemaShape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    if (!field.formKey) continue
    schemaShape[field.formKey] = buildFieldSchema(field, requiredFields)
  }
  schemaShape.socials = z.string().optional().default('')

  const hasChatFields =
    'chat' in schemaShape && 'chatService' in schemaShape

  const baseSchema = z.object(schemaShape)

  const schema = hasChatFields
    ? baseSchema.superRefine((data, ctx) => {
        const chatValues = normalizeStringArray(data.chat)
        const chatServiceValues = normalizeStringArray(data.chatService)
        const rowCount = Math.max(chatValues.length, chatServiceValues.length)

        for (let index = 0; index < rowCount; index += 1) {
          const chatName = chatValues[index]?.trim() ?? ''
          const chatService = chatServiceValues[index]?.trim() ?? ''

          if (chatName && !chatService) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['chatService'],
              message: 'Chat service is required',
            })
          }

          if (chatService && !chatName) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['chat'],
              message: 'Chat name is required',
            })
          }
        }
      })
    : baseSchema

  return {
    schema,
    requiredFields,
  }
}
