import { COUNTRY_OPTIONS } from '@repo/funnel'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { searchCities } from '../city-search'

const signal = new AbortController().signal

function stubFetch(data: unknown, init?: ResponseInit) {
  const fetchMock = vi.fn(async () => Response.json({ data }, init))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function requestedUrl(fetchMock: ReturnType<typeof stubFetch>) {
  const [url] = fetchMock.mock.calls[0] as unknown as [string]
  return new URL(url)
}

const KOREA = COUNTRY_OPTIONS.find((option) => option.code === 'KR')!
const NIGERIA = COUNTRY_OPTIONS.find((option) => option.code === 'NG')!

describe('searchCities', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('searches every country without narrowing', async () => {
    const fetchMock = stubFetch([])

    await searchCities('seo', signal)

    const url = requestedUrl(fetchMock)
    expect(url.pathname).toBe('/api/cities')
    expect(url.searchParams.get('q')).toBe('seo')
    expect(url.searchParams.has('country')).toBe(false)
  })

  test('searches the city part of an edited pick', async () => {
    const fetchMock = stubFetch([])

    await searchCities('Lagos, Nigeri', signal)

    expect(requestedUrl(fetchMock).searchParams.get('q')).toBe('Lagos')
  })

  test('keeps one suggestion per city and offered country, carrying the label', async () => {
    stubFetch([
      { name: 'Seoul', countryCode: 'KR', country: 'South Korea' },
      { name: 'Seoul', countryCode: 'KR', country: 'South Korea' },
      { name: 'Lagos', countryCode: 'NG', country: 'Nigeria' },
      { name: 'Nowhere', countryCode: 'QQ', country: 'Nowhere' },
    ])

    expect(await searchCities('seo', signal)).toEqual([
      { name: 'Seoul', country: KOREA.label },
      { name: 'Lagos', country: NIGERIA.label },
    ])
  })

  test('resolves to no suggestions when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      })
    )
    expect(await searchCities('seo', signal)).toEqual([])

    stubFetch([], { status: 429 })
    expect(await searchCities('seo', signal)).toEqual([])
  })
})

test('every country option has its own ISO code', () => {
  const codes = COUNTRY_OPTIONS.map((option) => option.code)

  expect(codes.every((code) => /^[A-Z]{2}$/.test(code))).toBe(true)
  expect(new Set(codes).size).toBe(codes.length)
})
