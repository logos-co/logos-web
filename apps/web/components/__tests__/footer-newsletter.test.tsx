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
  searchCities.mockImplementation(async () => [
    { name: 'Seoul', country: 'Korea, Republic of' },
    { name: 'Lagos', country: 'Nigeria' },
  ])
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() =>
    root.render(
      createElement(FooterNewsletter, {
        emailLabel: 'Email',
        roleLabel: 'Role',
        cityLabel: 'City',
        submitLabel: 'Subscribe',
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

// The picked country, drawn over the city input.
const pickedCountry = () =>
  container.querySelector('input[name="city"] ~ [aria-hidden] > :last-child')
    ?.textContent

const cityOptions = () =>
  [...container.querySelectorAll('[role="option"]')].map(
    (option) => option.textContent
  )

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

  it('suggests cities across every country', async () => {
    await typeCity('La')
    expect(searchCities).toHaveBeenLastCalledWith('La', expect.anything())
    expect(cityOptions()).toEqual(['SeoulKorea, Republic of', 'LagosNigeria'])
  })

  it('submits the picked city and its country', async () => {
    typeInto(emailInput(), 'reader@example.com')
    await typeCity('seo')

    keyDown(cityInput(), 'ArrowDown')
    expect(keyDown(cityInput(), 'Enter').defaultPrevented).toBe(true)
    expect(cityInput().value).toBe('Seoul')
    // Display only, so the submitted city keeps its casing.
    expect(cityInput().style.textTransform).toBe('uppercase')
    expect(pickedCountry()).toBe('Korea, Republic of')

    await submit()

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'reader@example.com',
      role: '',
      city: 'Seoul',
      country: 'Korea, Republic of',
    })
  })

  it('drops the pick when the city text is edited', async () => {
    typeInto(emailInput(), 'reader@example.com')
    await typeCity('seo')
    act(() =>
      container
        .querySelector<HTMLButtonElement>('[role="option"] button')!
        .click()
    )

    expect(cityInput().value).toBe('Seoul')

    await typeCity('Seou')
    expect(pickedCountry()).toBeUndefined()
    expect(cityInput().style.textTransform).toBe('')

    await submit()

    expect(onSubmit).not.toHaveBeenCalled()
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      'Pick a city from the list.'
    )
  })

  it('refuses a typed city that was not picked', async () => {
    typeInto(emailInput(), 'reader@example.com')
    await typeCity('Anyigba')

    await submit()

    expect(onSubmit).not.toHaveBeenCalled()
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      'Pick a city from the list.'
    )
  })
})
