import { afterEach, describe, expect, test, vi } from 'vitest'

import { submitNewsletterSignup } from '../newsletter-signup'

const LOGOS_NEWSLETTER = '6913441fee2f120001cec90d'

type FetchCall = [string, { body: string; method: string }]

function stubFetch() {
  const fetchMock = vi.fn(async () => Response.json({ ok: true }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function bodyOf(fetchMock: ReturnType<typeof stubFetch>) {
  const [, init] = fetchMock.mock.calls[0] as unknown as FetchCall
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

  test('omits blank role and city fields', async () => {
    const fetchMock = stubFetch()

    await submitNewsletterSignup({
      email: 'activist@example.com',
      role: '   ',
      city: '',
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
      newsletterId: 'regional-id',
      note: 'Profile: Activist Builder',
      formFields: {
        email: 'spoofed@example.com',
        role: 'spoofed role',
        city: 'spoofed city',
        type: 'spoofed',
        newsletter: 'spoofed-newsletter',
        note: 'spoofed note',
      },
    })

    expect(bodyOf(fetchMock)).toEqual({
      email: 'activist@example.com',
      role: 'Activist',
      city: 'Berlin',
      type: 'logos',
      newsletter: 'regional-id',
      note: 'Profile: Activist Builder',
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
