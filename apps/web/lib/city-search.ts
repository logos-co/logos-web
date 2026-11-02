/**
 * City suggestions for the signup forms, from the logos-admin GeoNames index
 * (`GET /api/cities`), so the static export ships no gazetteer. Same upstream
 * app and CORS allowlist as `newsletter-signup.ts`.
 */
import type { CitySearch, CitySuggestion } from '@acid-info/logos-ui/client'
import { COUNTRY_OPTIONS } from '@repo/funnel'

import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

export const CITIES_ENDPOINTS = {
  development: 'http://localhost:3003/api/cities',
  staging: 'https://dev-admin-acid.logos.co/api/cities',
  production: 'https://admin-acid.logos.co/api/cities',
} as const

type CitiesResponse = {
  data?: { name?: unknown; countryCode?: unknown }[]
}

const COUNTRY_BY_CODE = new Map(
  COUNTRY_OPTIONS.map((option) => [option.code, option])
)

/**
 * Cities matching `query` across every country, most populous first. Resolves
 * to an empty list on any failure, so the field falls back to free text.
 * `country` is the option label: the value the footer submits, and the funnel
 * forms map back to the option id.
 */
export const searchCities: CitySearch = async (query, signal) => {
  // A hand-typed "Lagos, Nigeria": search the city part.
  const params = new URLSearchParams({ q: query.split(',')[0]!.trim() })
  const endpoint = CITIES_ENDPOINTS[env.NEXT_PUBLIC_API_MODE ?? 'production']

  try {
    const response = await fetch(`${endpoint}?${params}`, {
      headers: { Accept: 'application/json' },
      signal,
    })
    if (!response.ok) return []

    const { data } = (await response.json()) as CitiesResponse
    const matches = new Map<string, CitySuggestion>()
    for (const city of data ?? []) {
      if (typeof city.name !== 'string' || typeof city.countryCode !== 'string')
        continue
      // A city in a country the forms do not offer could not set the country.
      const option = COUNTRY_BY_CODE.get(city.countryCode)
      if (!option) continue
      // Same-name places in one country are one suggestion.
      matches.set(`${city.name}|${option.code}`, {
        name: city.name,
        country: option.label,
      })
    }
    return [...matches.values()]
  } catch (error) {
    if (!signal?.aborted) logger.debug('City search failed', { error })
    return []
  }
}
