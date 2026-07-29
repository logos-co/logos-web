import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  resolveOptionLabel,
  submitFunnelNewsletterSignups,
  toLabelledFormFields,
} from '../funnel-newsletter-signup'

const LOGOS_NEWSLETTER = '6913441fee2f120001cec90d'
const REGIONAL_NEWSLETTER = '6a672fa7d5b09400014fffa1'

type FetchCall = [string, { body: string; method: string }]

function stubFetch() {
  const fetchMock = vi.fn(async () => Response.json({ ok: true }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function bodyOf(fetchMock: ReturnType<typeof stubFetch>, index: number) {
  const [, init] = fetchMock.mock.calls[index] as unknown as FetchCall
  return JSON.parse(init.body) as Record<string, unknown>
}

const BASE = {
  email: 'activist@example.com',
  formName: 'afformCoalitionPartner',
  city: 'Berlin',
  country: 'Germany',
}

describe('resolveOptionLabel', () => {
  // Shape of the real `AFFORM_OPTIONS.country` entries.
  const options = [
    { value: '1001', label: 'Afghanistan' },
    { value: '1082', label: 'Germany' },
  ]

  test('maps a CiviCRM option id to its label', () => {
    expect(resolveOptionLabel('1082', options)).toBe('Germany')
  })

  test('drops an unknown numeric id rather than leaking it into the note', () => {
    expect(resolveOptionLabel('9999', options)).toBe('')
  })

  test('drops any id when the form carries no options', () => {
    expect(resolveOptionLabel('1082', [])).toBe('')
  })

  test('passes a non-numeric value through as free text', () => {
    expect(resolveOptionLabel('Germany', options)).toBe('Germany')
  })

  test('reads the first entry of a repeatable value', () => {
    expect(resolveOptionLabel(['1082', '1001'], options)).toBe('Germany')
  })

  test('returns an empty string for blank, missing and non-text values', () => {
    expect(resolveOptionLabel('  ', options)).toBe('')
    expect(resolveOptionLabel('', options)).toBe('')
    expect(resolveOptionLabel([], options)).toBe('')
    expect(resolveOptionLabel(undefined, options)).toBe('')
    expect(resolveOptionLabel(true, options)).toBe('')
  })
})

describe('toLabelledFormFields', () => {
  // Shape of a real activist-builder submission.
  const fieldOptions = {
    country: [
      { value: '1003', label: 'Algeria' },
      { value: '1082', label: 'Germany' },
    ],
    skills: [
      { value: '4', label: 'Software Development' },
      { value: '7', label: 'Design' },
    ],
    chatService: [{ value: '3', label: 'Telegram' }],
    hearAbout: [{ value: '4', label: 'A friend or colleague' }],
    // Checkboxes carry an option list too, and must not be relabelled.
    wantsEvents: [{ value: '1', label: 'Yes' }],
  }

  test('replaces option ids with the labels the user picked', () => {
    expect(
      toLabelledFormFields(
        {
          name: 'Jules',
          city: 'Lyon',
          country: '1003',
          skills: ['4', '7'],
          chatService: ['3'],
          hearAbout: '4',
          wantsEvents: true,
          wantsNewsletter: true,
        },
        fieldOptions
      )
    ).toEqual({
      name: 'Jules',
      city: 'Lyon',
      country: 'Algeria',
      skills: ['Software Development', 'Design'],
      chatService: ['Telegram'],
      hearAbout: 'A friend or colleague',
      wantsEvents: true,
      wantsNewsletter: true,
    })
  })

  test('leaves fields without options untouched', () => {
    expect(
      toLabelledFormFields(
        {
          socials: '',
          website: ['website1', 'website2'],
          chat: ['handle1'],
          formName: 'afformActivistBuilder',
        },
        fieldOptions
      )
    ).toEqual({
      socials: '',
      website: ['website1', 'website2'],
      chat: ['handle1'],
      formName: 'afformActivistBuilder',
    })
  })

  test('blanks out ids that resolve to nothing', () => {
    expect(
      toLabelledFormFields(
        { country: '9999', skills: ['4', '9999'] },
        fieldOptions
      )
    ).toEqual({ country: '', skills: ['Software Development', ''] })
  })

  test('keeps repeatable rows aligned with their unfilled pair', () => {
    // `chat[i]` is the handle for `chatService[i]`, so a blank service must
    // keep its slot rather than shifting the rest of the column up.
    expect(
      toLabelledFormFields(
        { chat: ['handle1', 'handle2'], chatService: ['3', ''] },
        fieldOptions
      )
    ).toEqual({ chat: ['handle1', 'handle2'], chatService: ['Telegram', ''] })
  })
})

describe('submitFunnelNewsletterSignups', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('sends nothing when neither checkbox is ticked', async () => {
    const fetchMock = stubFetch()

    await submitFunnelNewsletterSignups({
      ...BASE,
      wantsNewsletter: false,
      wantsEvents: false,
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('subscribes to the Logos Newsletter with the form profile', async () => {
    const fetchMock = stubFetch()

    await submitFunnelNewsletterSignups({
      ...BASE,
      wantsNewsletter: true,
      wantsEvents: false,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(bodyOf(fetchMock, 0)).toEqual({
      email: 'activist@example.com',
      type: 'logos',
      newsletter: LOGOS_NEWSLETTER,
      note: 'Profile: Coalition Partner',
    })
  })

  test('subscribes to the Regional Newsletter with city, country and profile', async () => {
    const fetchMock = stubFetch()

    await submitFunnelNewsletterSignups({
      ...BASE,
      formName: 'afformActivistLeaderSteward',
      wantsNewsletter: false,
      wantsEvents: true,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(bodyOf(fetchMock, 0)).toEqual({
      email: 'activist@example.com',
      type: 'logos',
      newsletter: REGIONAL_NEWSLETTER,
      note: 'City: Berlin\nCountry: Germany\nProfile: Activist Leader / Steward',
    })
  })

  test('sends both subscriptions in order, Logos first', async () => {
    const fetchMock = stubFetch()

    await submitFunnelNewsletterSignups({
      ...BASE,
      formName: 'afformActivistBuilder',
      wantsNewsletter: true,
      wantsEvents: true,
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(bodyOf(fetchMock, 0)).toMatchObject({
      newsletter: LOGOS_NEWSLETTER,
      note: 'Profile: Activist Builder',
    })
    expect(bodyOf(fetchMock, 1)).toMatchObject({
      newsletter: REGIONAL_NEWSLETTER,
      note: 'City: Berlin\nCountry: Germany\nProfile: Activist Builder',
    })
  })

  test('the second subscription waits for the first to avoid racing the note merge', async () => {
    const order: string[] = []
    const fetchMock = vi.fn(async (_url: string, init: { body: string }) => {
      const { newsletter } = JSON.parse(init.body) as { newsletter: string }
      order.push(`start:${newsletter}`)
      await Promise.resolve()
      order.push(`end:${newsletter}`)
      return Response.json({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    await submitFunnelNewsletterSignups({
      ...BASE,
      wantsNewsletter: true,
      wantsEvents: true,
    })

    expect(order).toEqual([
      `start:${LOGOS_NEWSLETTER}`,
      `end:${LOGOS_NEWSLETTER}`,
      `start:${REGIONAL_NEWSLETTER}`,
      `end:${REGIONAL_NEWSLETTER}`,
    ])
  })

  test('omits blank city and country lines', async () => {
    const fetchMock = stubFetch()

    await submitFunnelNewsletterSignups({
      email: 'activist@example.com',
      formName: 'afformCoalitionPartner',
      city: '  ',
      country: '',
      wantsNewsletter: false,
      wantsEvents: true,
    })

    expect(bodyOf(fetchMock, 0)).toEqual({
      email: 'activist@example.com',
      type: 'logos',
      newsletter: REGIONAL_NEWSLETTER,
      note: 'Profile: Coalition Partner',
    })
  })

  test('omits the note entirely for an unknown form with no city or country', async () => {
    const fetchMock = stubFetch()

    await submitFunnelNewsletterSignups({
      email: 'activist@example.com',
      formName: 'afformCircleContactForm',
      wantsNewsletter: true,
      wantsEvents: true,
    })

    expect(bodyOf(fetchMock, 0)).toEqual({
      email: 'activist@example.com',
      type: 'logos',
      newsletter: LOGOS_NEWSLETTER,
    })
    expect(bodyOf(fetchMock, 1)).toEqual({
      email: 'activist@example.com',
      type: 'logos',
      newsletter: REGIONAL_NEWSLETTER,
    })
  })

  test('forwards the submitted answers on every subscription', async () => {
    const fetchMock = stubFetch()

    await submitFunnelNewsletterSignups({
      ...BASE,
      wantsNewsletter: true,
      wantsEvents: true,
      formFields: {
        formName: 'afformCoalitionPartner',
        affiliatedOrgs: 'Example Org',
        skills: ['Research'],
        wantsNewsletter: true,
        wantsEvents: true,
      },
    })

    for (const index of [0, 1]) {
      expect(bodyOf(fetchMock, index)).toMatchObject({
        formName: 'afformCoalitionPartner',
        affiliatedOrgs: 'Example Org',
        skills: ['Research'],
        wantsNewsletter: true,
        wantsEvents: true,
      })
    }
  })

  test('resolves rather than throwing when the upstream rejects', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchMock = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      submitFunnelNewsletterSignups({
        ...BASE,
        wantsNewsletter: true,
        wantsEvents: true,
      })
    ).resolves.toBeUndefined()

    // The Logos failure must not short-circuit the Regional subscription.
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('trims the submitted email', async () => {
    const fetchMock = stubFetch()

    await submitFunnelNewsletterSignups({
      ...BASE,
      email: '  activist@example.com  ',
      wantsNewsletter: true,
      wantsEvents: false,
    })

    expect(bodyOf(fetchMock, 0)).toMatchObject({
      email: 'activist@example.com',
    })
  })

  test('resolves rather than throwing on an invalid email', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchMock = stubFetch()

    await expect(
      submitFunnelNewsletterSignups({
        ...BASE,
        email: 'not-an-email',
        wantsNewsletter: true,
        wantsEvents: false,
      })
    ).resolves.toBeUndefined()

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
