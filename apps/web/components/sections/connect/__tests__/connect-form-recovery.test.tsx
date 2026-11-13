// @vitest-environment happy-dom
import { COUNTRY_OPTIONS } from '@repo/funnel'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import type { AfformConfig } from '@/lib/funnel-forms/types'

const { searchCities } = vi.hoisted(() => ({ searchCities: vi.fn() }))

vi.mock('@/lib/city-search', () => ({ searchCities }))
vi.mock('@/lib/env', () => ({
  env: { NEXT_PUBLIC_FUNNEL_MANUAL_LOCATION: true },
}))
vi.mock('@/components/ui/button', () => ({
  Button: (props: object) => createElement('button', props),
}))
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))
vi.mock('@/lib/funnel-newsletter-signup', () => ({
  toLabelledFormFields: vi.fn(() => ({})),
  submitFunnelNewsletterSignups: vi.fn(),
}))

import { ConnectFormSection } from '../connect-form-section'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const FORM: AfformConfig = {
  confirmationMessage: 'Test received',
  fields: [
    { formKey: 'name', label: 'Name', inputType: 'text' },
    { formKey: 'city', label: 'City', inputType: 'text' },
    { formKey: 'email', label: 'Email', inputType: 'email' },
  ],
}
const COUNTRY = COUNTRY_OPTIONS.find((option) => option.code === 'GB')!
const fetchMock = vi.fn<typeof fetch>()
let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_HCAPTCHA_SITEKEY', undefined)
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockResolvedValue(Response.json({ success: true }, { status: 201 }))
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() =>
    root.render(
      createElement(ConnectFormSection, {
        afform: FORM,
        afformOptions: { country: COUNTRY_OPTIONS },
        requiredFields: ['name', 'city', 'country', 'email'],
        apiEndpoint: '/intake',
      })
    )
  )
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

function enterAnswers() {
  act(() => {
    for (const [id, value] of Object.entries({
      name: 'QA',
      city: 'London',
      email: 'test@example.com',
    })) {
      const input = container.querySelector<HTMLInputElement>(`#${id}`)!
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
}

function pickCountry() {
  act(() => container.querySelector<HTMLButtonElement>('#country')!.click())
  const option = [
    ...container.querySelectorAll<HTMLButtonElement>('[role="option"]'),
  ].find((button) => button.textContent === COUNTRY.label)!
  act(() => option.click())
}

async function submit() {
  await act(async () => {
    container
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

it('submits a typed city and selected country without calling the cities API', async () => {
  enterAnswers()
  pickCountry()
  await submit()

  expect(searchCities).not.toHaveBeenCalled()
  expect(fetchMock).toHaveBeenCalledOnce()
  const [, request] = fetchMock.mock.calls[0]!
  expect(JSON.parse(request!.body as string)).toMatchObject({
    city: 'London',
    country: COUNTRY.value,
  })
  expect(container.textContent).toContain('Test received')
})

it('keeps country required during manual entry', async () => {
  enterAnswers()
  await submit()

  expect(fetchMock).not.toHaveBeenCalled()
  expect(container.textContent).toContain('selectFieldRequired')
  expect(searchCities).not.toHaveBeenCalled()
})
