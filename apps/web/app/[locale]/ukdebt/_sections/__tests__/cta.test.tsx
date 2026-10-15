// @vitest-environment happy-dom
import { act, createElement } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { submitNewsletterSignup } = vi.hoisted(() => ({
  submitNewsletterSignup: vi.fn(),
}))

vi.mock('@/lib/newsletter-signup', () => ({
  NEWSLETTER_IDS: { ukDebt: '6a0dd2f8d5b09400014fed2e' },
  submitNewsletterSignup,
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) =>
    createElement('a', { href }, children),
}))

import { Cta } from '../cta'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => root.render(createElement(Cta)))
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  submitNewsletterSignup.mockReset()
})

async function submitEmail(email: string) {
  const toggle = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Stay Informed'
  )!
  act(() => toggle.click())

  const input = container.querySelector<HTMLInputElement>('#ukdebt-email')!
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!.call(input, email)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })

  const form = container.querySelector('form')!
  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

describe('UK Debt Cta signup', () => {
  it('subscribes the email to the UK Debt newsletter', async () => {
    submitNewsletterSignup.mockResolvedValue(undefined)

    await submitEmail('reader@example.com')

    expect(submitNewsletterSignup).toHaveBeenCalledWith({
      email: 'reader@example.com',
      newsletterId: '6a0dd2f8d5b09400014fed2e',
    })
  })

  it('shows the success status and clears the input', async () => {
    submitNewsletterSignup.mockResolvedValue(undefined)

    await submitEmail('reader@example.com')

    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      'You’re on the list.'
    )
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(
      container.querySelector<HTMLInputElement>('#ukdebt-email')!.value
    ).toBe('')
  })

  it('shows the upstream error in an alert', async () => {
    submitNewsletterSignup.mockRejectedValue(new Error('Failed to subscribe.'))

    await submitEmail('reader@example.com')

    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      'Failed to subscribe.'
    )
    expect(
      container.querySelector<HTMLInputElement>('#ukdebt-email')!.value
    ).toBe('reader@example.com')
  })
})
