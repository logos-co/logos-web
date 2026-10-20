// @vitest-environment happy-dom
import { CITY_SEARCH_DEBOUNCE_MS } from '@acid-info/logos-ui/client'
import { COUNTRY_OPTIONS, REQUIRED_FIELDS_BY_FORM } from '@repo/funnel'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { searchCitiesByCountryId } = vi.hoisted(() => ({
  searchCitiesByCountryId: vi.fn(),
}))

vi.mock('@/lib/city-search', () => ({ searchCitiesByCountryId }))

// Its Link pulls in next-intl navigation, which needs the Next runtime.
vi.mock('@/components/ui/button', () => ({
  Button: (props: object) => createElement('button', props),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

import { AFFORM, AFFORM_NAME } from '@/lib/funnel-forms/afform-activist-builder'
import { AFFORM_OPTIONS } from '@/lib/funnel-forms/afform-options'

import { ConnectFormSection } from '../connect-form-section'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const NIGERIA = COUNTRY_OPTIONS.find((option) => option.code === 'NG')!
const KOREA = COUNTRY_OPTIONS.find((option) => option.code === 'KR')!

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.useFakeTimers()
  searchCitiesByCountryId.mockResolvedValue([
    { name: 'Lagos', country: NIGERIA.value },
  ])
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() =>
    root.render(
      createElement(ConnectFormSection, {
        afform: AFFORM,
        afformOptions: AFFORM_OPTIONS,
        requiredFields: REQUIRED_FIELDS_BY_FORM[AFFORM_NAME],
        apiEndpoint: '/intake',
      })
    )
  )
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  searchCitiesByCountryId.mockReset()
  vi.useRealTimers()
})

const cityInput = () => container.querySelector<HTMLInputElement>('#city')!
const countryTrigger = () =>
  container.querySelector<HTMLButtonElement>('#country')!

async function typeCity(value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!.call(cityInput(), value)
    cityInput().dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => {
    vi.advanceTimersByTime(CITY_SEARCH_DEBOUNCE_MS)
  })
}

function pickSuggestion() {
  act(() =>
    container
      .querySelector<HTMLButtonElement>('[role="option"] button')!
      .click()
  )
}

describe('ConnectFormSection city autocomplete', () => {
  it('suggests cities within the selected country id', async () => {
    await typeCity('lag')

    expect(searchCitiesByCountryId).toHaveBeenLastCalledWith(
      'lag',
      '',
      expect.anything()
    )
    expect(container.querySelector('[role="listbox"]')?.textContent).toContain(
      'LagosNigeria'
    )
  })

  it('a picked city sets the country too', async () => {
    await typeCity('lag')
    pickSuggestion()

    expect(cityInput().value).toBe('Lagos')
    expect(countryTrigger().textContent).toBe(NIGERIA.label)
  })

  it('clears a picked city when another country is chosen', async () => {
    await typeCity('lag')
    pickSuggestion()

    act(() => countryTrigger().click())
    const korea = [...container.querySelectorAll('[role="option"]')].find(
      (option) => option.textContent === KOREA.label
    ) as HTMLButtonElement
    act(() => korea.click())

    expect(cityInput().value).toBe('')
  })
})
