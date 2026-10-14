import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  submitDefaultNewsletterSignup,
  submitNewsletterSignup,
} from '../newsletter-signup'

const LOGOS_NEWSLETTER = '6913441fee2f120001cec90d'
const REGIONAL_NEWSLETTER = '6a672fa7d5b09400014fffa1'

type FetchCall = [string, { body: string; method: string }]

function stubFetch() {
  const fetchMock = vi.fn(async () => Response.json({ ok: true }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function bodyOf(fetchMock: ReturnType<typeof stubFetch>, index = 0) {
  const [, init] = fetchMock.mock.calls[index] as unknown as FetchCall
  return JSON.parse(init.body) as Record<string, unknown>
}

describe('submitNewsletterSignup', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('sends the role and city as fields as well as in the note', async () => {
    const fetchMock = stubFetch()

    await submitNewsletterSignup({
      email: 'activist@example.com',
      role: '  Activist  ',
      city: '  Berlin  ',
    })

    expect(bodyOf(fetchMock)).toEqual({
      email: 'activist@example.com',
      role: 'Activist',
      city: 'Berlin',
      type: 'logos',
      newsletter: LOGOS_NEWSLETTER,
      note: 'Role: Activist\nCity: Berlin',
    })
  })

  test('sends the country as a field and as its own note line', async () => {
    const fetchMock = stubFetch()

    await submitNewsletterSignup({
      email: 'activist@example.com',
      role: 'Activist',
      city: 'Burbank',
      country: '  United States  ',
    })

    expect(bodyOf(fetchMock)).toEqual({
      email: 'activist@example.com',
      role: 'Activist',
      city: 'Burbank',
      country: 'United States',
      type: 'logos',
      newsletter: LOGOS_NEWSLETTER,
      note: 'Role: Activist\nCity: Burbank\nCountry: United States',
    })
  })

  test('omits blank role, city and country fields', async () => {
    const fetchMock = stubFetch()

    await submitNewsletterSignup({
      email: 'activist@example.com',
      role: '   ',
      city: '',
      country: ' ',
    })

    expect(bodyOf(fetchMock)).toEqual({
      email: 'activist@example.com',
      type: 'logos',
      newsletter: LOGOS_NEWSLETTER,
    })
  })

  test('forwards every submitted form field verbatim', async () => {
    const fetchMock = stubFetch()

    await submitNewsletterSignup({
      email: 'activist@example.com',
      note: 'Profile: Coalition Partner',
      formFields: {
        formName: 'afformCoalitionPartner',
        organisation: 'Example Org',
        skills: ['Research', 'Design'],
        wantsNewsletter: true,
        wantsEvents: false,
        socials: '',
      },
    })

    expect(bodyOf(fetchMock)).toEqual({
      formName: 'afformCoalitionPartner',
      organisation: 'Example Org',
      skills: ['Research', 'Design'],
      wantsNewsletter: true,
      wantsEvents: false,
      socials: '',
      email: 'activist@example.com',
      type: 'logos',
      newsletter: LOGOS_NEWSLETTER,
      note: 'Profile: Coalition Partner',
    })
  })

  test('a forwarded field never overwrites a canonical payload key', async () => {
    const fetchMock = stubFetch()

    await submitNewsletterSignup({
      email: 'activist@example.com',
      role: 'Activist',
      city: 'Berlin',
      country: 'Germany',
      newsletterId: 'regional-id',
      note: 'Profile: Activist Builder',
      sendAutoReply: false,
      formFields: {
        email: 'spoofed@example.com',
        role: 'spoofed role',
        city: 'spoofed city',
        country: 'spoofed country',
        type: 'spoofed',
        newsletter: 'spoofed-newsletter',
        note: 'spoofed note',
        sendAutoReply: true,
      },
    })

    expect(bodyOf(fetchMock)).toEqual({
      email: 'activist@example.com',
      role: 'Activist',
      city: 'Berlin',
      country: 'Germany',
      type: 'logos',
      newsletter: 'regional-id',
      note: 'Profile: Activist Builder',
      sendAutoReply: false,
    })
  })

  test('rejects an invalid email before sending anything', async () => {
    const fetchMock = stubFetch()

    await expect(
      submitNewsletterSignup({ email: 'not-an-email' })
    ).rejects.toThrow('Please enter a valid email address.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('surfaces the upstream error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ error: 'Already subscribed.' }, { status: 400 })
      )
    )

    await expect(
      submitNewsletterSignup({ email: 'activist@example.com' })
    ).rejects.toThrow('Already subscribed.')
  })
})

describe('submitDefaultNewsletterSignup', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('subscribes only to the Logos Newsletter without a city or country', async () => {
    const fetchMock = stubFetch()

    await submitDefaultNewsletterSignup({
      email: 'activist@example.com',
      role: 'Builder',
      city: '  ',
      country: '',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(bodyOf(fetchMock)).toEqual({
      email: 'activist@example.com',
      role: 'Builder',
      type: 'logos',
      newsletter: LOGOS_NEWSLETTER,
      note: 'Role: Builder',
    })
  })

  test('adds the Regional Newsletter when only a city is given', async () => {
    const fetchMock = stubFetch()

    await submitDefaultNewsletterSignup({
      email: 'activist@example.com',
      city: 'Lyon',
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(bodyOf(fetchMock, 0)).toEqual({
      email: 'activist@example.com',
      city: 'Lyon',
      type: 'logos',
      newsletter: LOGOS_NEWSLETTER,
      note: 'City: Lyon',
    })
    expect(bodyOf(fetchMock, 1)).toEqual({
      email: 'activist@example.com',
      city: 'Lyon',
      type: 'logos',
      newsletter: REGIONAL_NEWSLETTER,
      sendAutoReply: false,
    })
  })

  test('adds the Regional Newsletter when only a country is given', async () => {
    const fetchMock = stubFetch()

    await submitDefaultNewsletterSignup({
      email: 'activist@example.com',
      country: 'France',
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(bodyOf(fetchMock, 1)).toEqual({
      email: 'activist@example.com',
      country: 'France',
      type: 'logos',
      newsletter: REGIONAL_NEWSLETTER,
      sendAutoReply: false,
    })
  })

  test('sends the fields and form answers to both newsletters but the note only once', async () => {
    const fetchMock = stubFetch()

    await submitDefaultNewsletterSignup({
      email: 'activist@example.com',
      role: 'activist',
      city: 'Burbank',
      country: 'United States',
      formFields: { source: 'map' },
    })

    const shared = {
      source: 'map',
      email: 'activist@example.com',
      role: 'activist',
      city: 'Burbank',
      country: 'United States',
      type: 'logos',
    }
    expect(bodyOf(fetchMock, 0)).toEqual({
      ...shared,
      newsletter: LOGOS_NEWSLETTER,
      note: 'Role: activist\nCity: Burbank\nCountry: United States',
    })
    expect(bodyOf(fetchMock, 1)).toEqual({
      ...shared,
      newsletter: REGIONAL_NEWSLETTER,
      sendAutoReply: false,
    })
  })

  test('the Regional subscription waits for the Logos one to avoid racing the note merge', async () => {
    const order: string[] = []
    const fetchMock = vi.fn(async (_url: string, init: { body: string }) => {
      const { newsletter } = JSON.parse(init.body) as { newsletter: string }
      order.push(`start:${newsletter}`)
      await Promise.resolve()
      order.push(`end:${newsletter}`)
      return Response.json({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    await submitDefaultNewsletterSignup({
      email: 'activist@example.com',
      city: 'Berlin',
    })

    expect(order).toEqual([
      `start:${LOGOS_NEWSLETTER}`,
      `end:${LOGOS_NEWSLETTER}`,
      `start:${REGIONAL_NEWSLETTER}`,
      `end:${REGIONAL_NEWSLETTER}`,
    ])
  })

  test('rejects and skips the Regional Newsletter when the Logos subscription fails', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ error: 'Upstream down.' }, { status: 500 })
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      submitDefaultNewsletterSignup({
        email: 'activist@example.com',
        city: 'Berlin',
      })
    ).rejects.toThrow('Upstream down.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test('resolves when only the Regional subscription fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ ok: true }))
      .mockResolvedValueOnce(
        Response.json({ error: 'Upstream down.' }, { status: 500 })
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      submitDefaultNewsletterSignup({
        email: 'activist@example.com',
        city: 'Berlin',
      })
    ).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
