import { COUNTRY_OPTIONS } from '@repo/funnel'
import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  searchCities,
  searchCitiesByCountryId,
  searchCitiesByCountryLabel,
} from '../city-search'

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

describe('searchCities', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('narrows the search to the country ISO code', async () => {
    const fetchMock = stubFetch([])

    await searchCities('seo', KOREA, signal)

    const url = requestedUrl(fetchMock)
    expect(url.pathname).toBe('/api/cities')
    expect(url.searchParams.get('q')).toBe('seo')
    expect(url.searchParams.get('country')).toBe('KR')
  })

  test('searches every country without one', async () => {
    const fetchMock = stubFetch([])

    await searchCities('seo')

    expect(requestedUrl(fetchMock).searchParams.has('country')).toBe(false)
  })

  test('keeps one suggestion per city and offered country', async () => {
    stubFetch([
      { name: 'Seoul', countryCode: 'KR', country: 'South Korea' },
      { name: 'Seoul', countryCode: 'KR', country: 'South Korea' },
      { name: 'Seoul', countryCode: 'QQ', country: 'Nowhere' },
    ])

    expect(await searchCities('seo')).toEqual([
      { name: 'Seoul', country: KOREA },
    ])
  })

  test('resolves to no suggestions when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      })
    )
    expect(await searchCities('seo')).toEqual([])

    stubFetch([], { status: 429 })
    expect(await searchCities('seo')).toEqual([])
  })
})

describe('country adapters', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('the footer speaks country labels', async () => {
    const fetchMock = stubFetch([{ name: 'Seoul', countryCode: 'KR' }])

    expect(
      await searchCitiesByCountryLabel('seo', 'Korea, Republic of', signal)
    ).toEqual([{ name: 'Seoul', country: 'Korea, Republic of' }])
    expect(requestedUrl(fetchMock).searchParams.get('country')).toBe('KR')
  })

  test('the funnel forms speak country option ids', async () => {
    const fetchMock = stubFetch([{ name: 'Seoul', countryCode: 'KR' }])

    expect(await searchCitiesByCountryId('seo', KOREA.value, signal)).toEqual([
      { name: 'Seoul', country: KOREA.value },
    ])
    expect(requestedUrl(fetchMock).searchParams.get('country')).toBe('KR')
  })
})

test('every country option has its own ISO code', () => {
  const codes = COUNTRY_OPTIONS.map((option) => option.code)

  expect(codes.every((code) => /^[A-Z]{2}$/.test(code))).toBe(true)
  expect(new Set(codes).size).toBe(codes.length)
})
