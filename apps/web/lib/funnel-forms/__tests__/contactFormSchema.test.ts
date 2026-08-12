import { describe, expect, it } from 'vitest'

import { buildFormSchema, MAX_TEXT_LENGTH } from '../contactFormSchema'
import type { AfformField } from '../types'

const TEXT_FIELD: AfformField = {
  formKey: 'background',
  label: 'Background',
  inputType: 'textarea',
  required: false,
}

const CHAT_FIELDS: AfformField[] = [
  {
    formKey: 'chat',
    label: 'Chat Name',
    inputType: 'text',
    required: false,
    repeatable: true,
  },
  {
    formKey: 'chatService',
    label: 'Chat Service',
    inputType: 'select',
    required: false,
    repeatable: true,
  },
]

const COUNTRY_FIELD: AfformField = {
  formKey: 'country',
  label: 'Country',
  inputType: 'select',
  required: true,
}

describe('buildFormSchema select validation', () => {
  it('rejects an empty required select', () => {
    const { schema, requiredFields } = buildFormSchema([COUNTRY_FIELD], [])

    expect(requiredFields.has('country')).toBe(true)

    const result = schema.safeParse({ country: '', socials: '' })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((issue) => issue.path[0] === 'country')).toBe(
      true
    )
  })

  it('accepts a selected option', () => {
    const { schema } = buildFormSchema([COUNTRY_FIELD], [])

    const result = schema.safeParse({ country: '1003', socials: '' })

    expect(result.success).toBe(true)
  })
})

describe('buildFormSchema chat validation', () => {
  it('requires chat service when a chat name is entered', () => {
    const { schema } = buildFormSchema(CHAT_FIELDS, [])

    const result = schema.safeParse({
      chat: ['alice'],
      chatService: [''],
      socials: '',
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((issue) => issue.path[0] === 'chatService')).toBe(
      true
    )
  })

  it('requires chat name when a chat service is selected', () => {
    const { schema } = buildFormSchema(CHAT_FIELDS, [])

    const result = schema.safeParse({
      chat: [''],
      chatService: ['1'],
      socials: '',
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((issue) => issue.path[0] === 'chat')).toBe(true)
  })

  it('allows empty chat rows', () => {
    const { schema } = buildFormSchema(CHAT_FIELDS, [])

    const result = schema.safeParse({
      chat: [''],
      chatService: [''],
      socials: '',
    })

    expect(result.success).toBe(true)
  })
})

describe('buildFormSchema text length limit', () => {
  it('accepts text fields at the maximum length', () => {
    const { schema } = buildFormSchema([TEXT_FIELD], [])

    const result = schema.safeParse({
      background: 'a'.repeat(MAX_TEXT_LENGTH),
      socials: '',
    })

    expect(result.success).toBe(true)
  })

  it('rejects text fields longer than the maximum length', () => {
    const { schema } = buildFormSchema([TEXT_FIELD], [])

    const result = schema.safeParse({
      background: 'a'.repeat(MAX_TEXT_LENGTH + 1),
      socials: '',
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(
      result.error.issues.some((issue) => issue.path[0] === 'background')
    ).toBe(true)
  })
})
