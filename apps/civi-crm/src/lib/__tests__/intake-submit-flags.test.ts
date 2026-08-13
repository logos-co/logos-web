import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { isNotionIntakeSubmitEnabled } from '../intake-submit-flags'

describe('intake submit flags', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.FUNNEL_INTAKE_NOTION_DISABLED
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('enables Notion by default', () => {
    expect(isNotionIntakeSubmitEnabled()).toBe(true)
  })

  it.each(['1', 'true', 'TRUE', ' yes ', 'on'])(
    'disables Notion when FUNNEL_INTAKE_NOTION_DISABLED=%s',
    (value) => {
      process.env.FUNNEL_INTAKE_NOTION_DISABLED = value
      expect(isNotionIntakeSubmitEnabled()).toBe(false)
    }
  )

  it('treats non-truthy disable values as enabled', () => {
    process.env.FUNNEL_INTAKE_NOTION_DISABLED = 'false'
    expect(isNotionIntakeSubmitEnabled()).toBe(true)
  })
})
