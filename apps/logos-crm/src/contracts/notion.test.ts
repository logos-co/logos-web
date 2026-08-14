import { describe, expect, test } from 'vitest'

import { mapNotionPage, NOTION_PROPERTIES, type NotionPage } from './notion'

function page(properties: Record<string, unknown>): NotionPage {
  return {
    id: 'page-1',
    last_edited_time: '2026-07-01T10:00:00.000Z',
    properties: {
      [NOTION_PROPERTIES.name]: {
        title: [{ plain_text: 'Amina Okafor' }],
      },
      ...properties,
    },
  }
}

describe('notion page mapping', () => {
  test('maps the properties the intake endpoint writes', () => {
    const mapped = mapNotionPage(
      page({
        [NOTION_PROPERTIES.email]: { email: 'amina@opensystems.example' },
        [NOTION_PROPERTIES.city]: { rich_text: [{ plain_text: 'Lisbon' }] },
        [NOTION_PROPERTIES.country]: {
          rich_text: [{ plain_text: 'Portugal' }],
        },
        [NOTION_PROPERTIES.organisation]: {
          rich_text: [{ plain_text: 'Open Systems Lab' }],
        },
        [NOTION_PROPERTIES.profile]: { select: { name: 'Coalition Partner' } },
        [NOTION_PROPERTIES.hearAbout]: { select: { name: 'Podcast' } },
      })
    )

    expect(mapped).toMatchObject({
      pageId: 'page-1',
      name: 'Amina Okafor',
      email: 'amina@opensystems.example',
      city: 'Lisbon',
      country: 'Portugal',
      affiliatedOrgs: 'Open Systems Lab',
      formName: 'afformCoalitionPartner',
      hearAbout: 'Podcast',
    })
  })

  test('maps each profile back to the form that produced it', () => {
    const builder = mapNotionPage(
      page({
        [NOTION_PROPERTIES.profile]: { select: { name: 'Activist Builder' } },
      })
    )
    const steward = mapNotionPage(
      page({
        [NOTION_PROPERTIES.profile]: {
          select: { name: 'Activist Leader / Steward' },
        },
      })
    )

    expect(builder?.formName).toBe('afformActivistBuilder')
    expect(steward?.formName).toBe('afformActivistLeaderSteward')
  })

  test('still imports a page whose profile is missing or unknown', () => {
    const unknown = mapNotionPage(
      page({
        [NOTION_PROPERTIES.profile]: { select: { name: 'Something New' } },
      })
    )

    // Losing an applicant over an uncurated select value would be the wrong
    // trade; the case is still triaged by a human.
    expect(unknown?.formName).toBe('afformCoalitionPartner')
    expect(mapNotionPage(page({}))?.formName).toBe('afformCoalitionPartner')
  })

  test('collects every website column into one list', () => {
    const mapped = mapNotionPage(
      page({
        Website: { url: 'https://one.example' },
        'Website 3': { url: 'https://three.example' },
      })
    )

    expect(mapped?.website).toEqual([
      'https://one.example',
      'https://three.example',
    ])
  })

  test('reads the phone or social handle as a chat handle', () => {
    const mapped = mapNotionPage(
      page({ [NOTION_PROPERTIES.phone]: { phone_number: '@amina' } })
    )

    expect(mapped?.chat).toEqual(['@amina'])
  })

  test('joins multi-select skills into a readable summary', () => {
    const mapped = mapNotionPage(
      page({
        [NOTION_PROPERTIES.skills]: {
          multi_select: [{ name: 'Research' }, { name: 'Facilitation' }],
        },
      })
    )

    expect(mapped?.skills).toBe('Research, Facilitation')
  })

  test('defaults consent to false when the checkboxes are absent', () => {
    const mapped = mapNotionPage(page({}))

    expect(mapped?.wantsNewsletter).toBe(false)
    expect(mapped?.wantsEvents).toBe(false)
  })

  test('carries consent through when the checkboxes are ticked', () => {
    const mapped = mapNotionPage(
      page({
        [NOTION_PROPERTIES.wantsNewsletter]: { checkbox: true },
        [NOTION_PROPERTIES.wantsEvents]: { checkbox: false },
      })
    )

    expect(mapped?.wantsNewsletter).toBe(true)
    expect(mapped?.wantsEvents).toBe(false)
  })

  test('refuses a page with no name', () => {
    expect(
      mapNotionPage({ id: 'page-2', properties: { Name: { title: [] } } })
    ).toBeNull()
    expect(mapNotionPage({ id: 'page-3' })).toBeNull()
  })

  test('keeps the last edited time for the watermark', () => {
    expect(mapNotionPage(page({}))?.lastEditedAt).toBe(
      '2026-07-01T10:00:00.000Z'
    )
  })
})
