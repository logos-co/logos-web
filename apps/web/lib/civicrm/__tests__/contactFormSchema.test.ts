import { describe, expect, it } from 'vitest'

import { buildFormSchema, MAX_TEXT_LENGTH } from '../contactFormSchema'
import type { AfformField } from '../types'

const TEXT_FIELD: AfformField = {
  entity: 'Individual1',
  join: null,
  fieldName: 'background',
  label: 'Background',
  required: false,
  options: null,
  inputAttrs: [],
  formKey: 'background',
  inputType: 'textarea',
}

const CHAT_FIELDS: AfformField[] = [
  {
    entity: 'Individual1',
    join: 'IM',
    fieldName: 'name',
    label: 'Chat Name',
    required: false,
    options: null,
    inputAttrs: [],
    formKey: 'chat',
    inputType: 'text',
  },
  {
    entity: 'Individual1',
    join: 'IM',
    fieldName: 'provider_id',
    label: 'Chat Service',
    required: false,
    options: null,
    inputAttrs: [],
    formKey: 'chatService',
    inputType: 'select',
  },
]

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
