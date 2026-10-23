// @vitest-environment happy-dom
import {
  CITY_SEARCH_DEBOUNCE_MS,
  FooterNewsletter,
  type CitySearch,
} from '@acid-info/logos-ui/client'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const searchCities = vi.fn<CitySearch>()
const onSubmit = vi.fn(async () => {})

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.useFakeTimers()
  searchCities.mockImplementation(async (_query, country) =>
    country === 'Nigeria'
      ? [{ name: 'Lagos', country: 'Nigeria' }]
      : [
          { name: 'Seoul', country: 'Korea, Republic of' },
          { name: 'Lagos', country: 'Nigeria' },
        ]
  )
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() =>
    root.render(
      createElement(FooterNewsletter, {
        emailLabel: 'Email',
        roleLabel: 'Role',
        cityLabel: 'City',
        countryLabel: 'Country',
        submitLabel: 'Subscribe',
        countryOptions: ['Korea, Republic of', 'Nigeria'],
        searchCities,
        onSubmit,
      })
    )
  )
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  searchCities.mockReset()
  onSubmit.mockClear()
  vi.useRealTimers()
})

function typeInto(input: HTMLInputElement, value: string) {
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const emailInput = () =>
  container.querySelector<HTMLInputElement>('input[name="email"]')!
const cityInput = () =>
  container.querySelector<HTMLInputElement>('input[name="city"]')!

async function typeCity(value: string) {
  typeInto(cityInput(), value)
  await act(async () => {
    vi.advanceTimersByTime(CITY_SEARCH_DEBOUNCE_MS)
  })
}

const cityOptions = () =>
  [...container.querySelectorAll('[role="option"]')].map(
    (option) => option.textContent
  )

function pickCountry(label: string) {
  const trigger = container.querySelector<HTMLButtonElement>(
    'button[aria-label="Country"]'
  )!
  act(() => trigger.click())
  const option = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === label
  )!
  act(() => option.click())
}

function keyDown(input: HTMLInputElement, key: string) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  })
  act(() => {
    input.dispatchEvent(event)
  })
  return event
}

async function submit() {
  await act(async () => {
    container
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

describe('FooterNewsletter city autocomplete', () => {
  it('waits for two characters before searching', async () => {
    await typeCity('L')

    expect(searchCities).not.toHaveBeenCalled()
  })

  it('suggests cities within the selected country', async () => {
    await typeCity('La')
    expect(searchCities).toHaveBeenLastCalledWith('La', '', expect.anything())
    expect(cityOptions()).toEqual(['SeoulKorea, Republic of', 'LagosNigeria'])

    pickCountry('Nigeria')
    await typeCity('Lag')

    expect(searchCities).toHaveBeenLastCalledWith(
      'Lag',
      'Nigeria',
      expect.anything()
    )
    expect(cityOptions()).toEqual(['LagosNigeria'])
  })

  it('submits the picked suggestion and its country', async () => {
    typeInto(emailInput(), 'reader@example.com')
    await typeCity('seo')

    keyDown(cityInput(), 'ArrowDown')
    expect(keyDown(cityInput(), 'Enter').defaultPrevented).toBe(true)
    expect(cityOptions()).toEqual([])

    await submit()

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'reader@example.com',
      role: '',
      city: 'Seoul',
      country: 'Korea, Republic of',
    })
  })

  it('clears a picked city when the country changes', async () => {
    await typeCity('seo')
    act(() =>
      container
        .querySelector<HTMLButtonElement>('[role="option"] button')!
        .click()
    )

    pickCountry('Nigeria')

    expect(cityInput().value).toBe('')
  })

  it('still submits free text', async () => {
    typeInto(emailInput(), 'reader@example.com')
    pickCountry('Nigeria')
    await typeCity('Anyigba')

    // No highlighted suggestion, so Enter is left to submit the form.
    expect(keyDown(cityInput(), 'Enter').defaultPrevented).toBe(false)
    await submit()

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Anyigba', country: 'Nigeria' })
    )
  })

  it.each([
    ['a city without a country', () => typeCity('Anyigba')],
    ['a country without a city', async () => pickCountry('Nigeria')],
  ])('refuses %s', async (_case, fill) => {
    typeInto(emailInput(), 'reader@example.com')
    await fill()

    await submit()

    expect(onSubmit).not.toHaveBeenCalled()
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      'Please enter both a city and a country, or neither.'
    )
  })
})
