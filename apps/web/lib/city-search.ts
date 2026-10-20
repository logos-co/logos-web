/**
 * City suggestions for the signup forms, from the logos-admin GeoNames index
 * (`GET /api/cities`), so the static export ships no gazetteer. Same upstream
 * app and CORS allowlist as `newsletter-signup.ts`.
 */
import type { CitySearch } from '@acid-info/logos-ui/client'
import { COUNTRY_OPTIONS, type FunnelCountryOption } from '@repo/funnel'

import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

export const CITIES_ENDPOINTS = {
  development: 'http://localhost:3003/api/cities',
  staging: 'https://dev-admin-acid.logos.co/api/cities',
  production: 'https://admin-acid.logos.co/api/cities',
} as const

export type CityMatch = { name: string; country: FunnelCountryOption }

type CitiesResponse = {
  data?: { name?: unknown; countryCode?: unknown }[]
}

const COUNTRY_BY_CODE = new Map(
  COUNTRY_OPTIONS.map((option) => [option.code, option])
)

/**
 * Cities matching `query`, within `country` when given. Resolves to an empty
 * list on any failure, so the field falls back to free text.
 */
export async function searchCities(
  query: string,
  country?: FunnelCountryOption,
  signal?: AbortSignal
): Promise<CityMatch[]> {
  const params = new URLSearchParams({ q: query })
  if (country) params.set('country', country.code)
  const endpoint = CITIES_ENDPOINTS[env.NEXT_PUBLIC_API_MODE ?? 'production']

  try {
    const response = await fetch(`${endpoint}?${params}`, {
      headers: { Accept: 'application/json' },
      signal,
    })
    if (!response.ok) return []

    const { data } = (await response.json()) as CitiesResponse
    const matches = new Map<string, CityMatch>()
    for (const city of data ?? []) {
      if (typeof city.name !== 'string' || typeof city.countryCode !== 'string')
        continue
      // A city in a country the forms do not offer could not set the country.
      const option = COUNTRY_BY_CODE.get(city.countryCode)
      if (!option) continue
      // Same-name places in one country are one suggestion.
      matches.set(`${city.name}|${option.code}`, {
        name: city.name,
        country: option,
      })
    }
    return [...matches.values()]
  } catch (error) {
    if (!signal?.aborted) logger.debug('City search failed', { error })
    return []
  }
}

/** For forms whose country value is the option label (the footer). */
export const searchCitiesByCountryLabel: CitySearch = async (
  query,
  label,
  signal
) => {
  const country = COUNTRY_OPTIONS.find((option) => option.label === label)
  const matches = await searchCities(query, country, signal)
  return matches.map(({ name, country }) => ({ name, country: country.label }))
}

/** For forms whose country value is the option id (the funnel forms). */
export const searchCitiesByCountryId: CitySearch = async (
  query,
  id,
  signal
) => {
  const country = COUNTRY_OPTIONS.find((option) => option.value === id)
  const matches = await searchCities(query, country, signal)
  return matches.map(({ name, country }) => ({ name, country: country.value }))
}
