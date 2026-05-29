import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  isCiviCrmIntakeSubmitEnabled,
  isNotionIntakeSubmitEnabled,
} from '../intake-submit-flags'

describe('intake submit flags', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.FUNNEL_INTAKE_NOTION_DISABLED
    delete process.env.FUNNEL_INTAKE_CIVICRM_DISABLED
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('enables both destinations by default', () => {
    expect(isNotionIntakeSubmitEnabled()).toBe(true)
    expect(isCiviCrmIntakeSubmitEnabled()).toBe(true)
  })

  it.each(['1', 'true', 'TRUE', ' yes ', 'on'])(
    'disables Notion when FUNNEL_INTAKE_NOTION_DISABLED=%s',
    (value) => {
      process.env.FUNNEL_INTAKE_NOTION_DISABLED = value
      expect(isNotionIntakeSubmitEnabled()).toBe(false)
      expect(isCiviCrmIntakeSubmitEnabled()).toBe(true)
    }
  )

  it.each(['1', 'true', 'yes'])(
    'disables CiviCRM when FUNNEL_INTAKE_CIVICRM_DISABLED=%s',
    (value) => {
      process.env.FUNNEL_INTAKE_CIVICRM_DISABLED = value
      expect(isCiviCrmIntakeSubmitEnabled()).toBe(false)
      expect(isNotionIntakeSubmitEnabled()).toBe(true)
    }
  )

  it('treats non-truthy disable values as enabled', () => {
    process.env.FUNNEL_INTAKE_NOTION_DISABLED = 'false'
    process.env.FUNNEL_INTAKE_CIVICRM_DISABLED = '0'
    expect(isNotionIntakeSubmitEnabled()).toBe(true)
    expect(isCiviCrmIntakeSubmitEnabled()).toBe(true)
  })
})
