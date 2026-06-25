import { describe, expect, it } from 'vitest'

import {
  buildNotionProperties,
  resolveOrganizationSelect,
} from '../build-notion-properties'

describe('resolveOrganizationSelect', () => {
  it('returns canonical option name on case-insensitive match', () => {
    expect(
      resolveOrganizationSelect('logos', ['Logos', 'Status'])
    ).toBe('Logos')
  })

  it('returns submitted value when no option matches', () => {
    expect(resolveOrganizationSelect('New Org', ['Logos'])).toBe('New Org')
  })

  it('returns empty string for blank input', () => {
    expect(resolveOrganizationSelect('  ', ['Logos'])).toBe('')
  })
})

describe('buildNotionProperties', () => {
  const baseData = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    city: 'London',
    country: '1226',
    skills: ['1', '6'],
    affiliatedOrgs: 'Logos',
    website: ['https://example.com', 'https://logos.co'],
    chat: ['adal', 'ada_logos'],
    chatService: ['3', '2'],
    questions: 'How do I join?',
    wantsEvents: true,
    wantsNewsletter: false,
  }

  it('maps coalition partner fields to funnel properties', () => {
    const properties = buildNotionProperties(
      { ...baseData, backgroundPartner: 'We build networks.' },
      'afformCoalitionPartner',
      'Logos'
    )

    expect(properties.Name).toEqual({
      title: [{ type: 'text', text: { content: 'Ada Lovelace' } }],
    })
    expect(properties['Email/Website']).toEqual({ email: 'ada@example.com' })
    expect(properties.City).toEqual({
      rich_text: [{ type: 'text', text: { content: 'London' } }],
    })
    expect(properties.Country).toEqual({
      rich_text: [{ type: 'text', text: { content: 'United Kingdom' } }],
    })
    expect(properties.Organization).toEqual({ select: { name: 'Logos' } })
    expect(properties.Profile).toEqual({
      select: { name: 'Coalition Partner' },
    })
    expect(properties.BU).toEqual({ multi_select: [{ name: 'Movement' }] })
    expect(properties['Mvmt Status']).toEqual({ select: { name: 'New Lead' } })
    expect(properties.Website).toEqual({ url: 'https://example.com' })
    expect(properties['Website 2']).toEqual({ url: 'https://logos.co' })
    expect(properties['Website 3']).toBeUndefined()
    expect(properties['Phone or Social Handle']).toEqual({
      phone_number: 'adal (X) | ada_logos (Telegram)',
    })
    expect(properties.Skills).toEqual({
      multi_select: [{ name: 'Developer' }, { name: 'Researcher' }],
    })
    expect(properties.Background).toEqual({
      rich_text: [{ type: 'text', text: { content: 'We build networks.' } }],
    })
    expect(properties['Tech Vision']).toBeUndefined()
    expect(properties['Activities Vision']).toBeUndefined()
    expect(properties.Questions).toEqual({
      rich_text: [{ type: 'text', text: { content: 'How do I join?' } }],
    })
    expect(properties['Wants Events']).toEqual({ checkbox: true })
    expect(properties['Wants Newsletter']).toEqual({ checkbox: false })
  })

  it('maps activist builder background and tech vision', () => {
    const properties = buildNotionProperties(
      {
        ...baseData,
        backgroundBuilder: 'Builder bio',
        techVision: 'Local mesh tools',
      },
      'afformActivistBuilder',
      'Logos'
    )

    expect(properties.BU).toEqual({ multi_select: [{ name: 'Movement' }] })
    expect(properties.Profile).toEqual({
      select: { name: 'Activist Builder' },
    })
    expect(properties.Background).toEqual({
      rich_text: [{ type: 'text', text: { content: 'Builder bio' } }],
    })
    expect(properties['Tech Vision']).toEqual({
      rich_text: [{ type: 'text', text: { content: 'Local mesh tools' } }],
    })
  })

  it('maps activist leader background and activities vision', () => {
    const properties = buildNotionProperties(
      {
        ...baseData,
        backgroundLeader: 'Leader bio',
        activitiesVision: 'Community workshops',
      },
      'afformActivistLeaderSteward',
      'Logos'
    )

    expect(properties.BU).toEqual({ multi_select: [{ name: 'Movement' }] })
    expect(properties.Profile).toEqual({
      select: { name: 'Activist Leader / Steward' },
    })
    expect(properties.Background).toEqual({
      rich_text: [{ type: 'text', text: { content: 'Leader bio' } }],
    })
    expect(properties['Activities Vision']).toEqual({
      rich_text: [
        { type: 'text', text: { content: 'Community workshops' } },
      ],
    })
  })

  it('spreads websites across Website .. Website 5 and caps at five', () => {
    const properties = buildNotionProperties(
      {
        ...baseData,
        website: [
          'https://one.com',
          'https://two.com',
          'https://three.com',
          'https://four.com',
          'https://five.com',
          'https://six.com',
        ],
      },
      'afformCoalitionPartner',
      'Logos'
    )

    expect(properties.Website).toEqual({ url: 'https://one.com' })
    expect(properties['Website 2']).toEqual({ url: 'https://two.com' })
    expect(properties['Website 3']).toEqual({ url: 'https://three.com' })
    expect(properties['Website 4']).toEqual({ url: 'https://four.com' })
    expect(properties['Website 5']).toEqual({ url: 'https://five.com' })
    expect(properties['Website 6']).toBeUndefined()
  })

  it('fills website columns contiguously, skipping blank rows', () => {
    const properties = buildNotionProperties(
      { ...baseData, website: ['', 'https://only.com', ''] },
      'afformCoalitionPartner',
      'Logos'
    )

    expect(properties.Website).toEqual({ url: 'https://only.com' })
    expect(properties['Website 2']).toBeUndefined()
  })

  it('omits all website columns when none submitted', () => {
    const properties = buildNotionProperties(
      { ...baseData, website: [] },
      'afformCoalitionPartner',
      'Logos'
    )

    expect(properties.Website).toBeUndefined()
    expect(properties['Website 2']).toBeUndefined()
  })

  it('omits Organization when resolved value is empty', () => {
    const properties = buildNotionProperties(
      baseData,
      'afformCoalitionPartner',
      ''
    )

    expect(properties.Organization).toBeUndefined()
  })
})
