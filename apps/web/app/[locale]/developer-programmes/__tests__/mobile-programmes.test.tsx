// @vitest-environment happy-dom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { developerProgrammesCopySectionSchema } from '@repo/content/schemas'
import page from '../../../../../../content/pages/en/developer-programmes.json' with { type: 'json' }

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement('img', { src, alt }),
}))
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; href: string }) =>
    createElement('a', props, children),
}))

import { MobileProgrammes } from '../_sections/mobile-programmes'
import { MobileComparison } from '../_sections/mobile-comparison'
import { Comparison } from '../_sections/comparison'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
const copy = developerProgrammesCopySectionSchema.parse(page.sections[0])
let container: HTMLDivElement
let root: Root
beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('mobile programme content', () => {
  it('opens and closes each card independently with accessible state', () => {
    act(() => root.render(createElement(MobileProgrammes, copy)))
    const buttons = [...container.querySelectorAll('button')]
    const panels = buttons.map(
      (button) =>
        container.querySelector<HTMLElement>(
          `#${button.getAttribute('aria-controls')}`
        )!
    )
    expect(panels.every((panel) => panel.hidden)).toBe(true)
    act(() => buttons[1]!.click())
    expect(buttons[1]!.getAttribute('aria-expanded')).toBe('true')
    expect(panels[1]!.hidden).toBe(false)
    expect(panels[0]!.hidden).toBe(true)
    act(() => buttons[0]!.click())
    expect(panels.every((panel) => !panel.hidden)).toBe(true)
    act(() => buttons[1]!.click())
    expect(buttons[1]!.getAttribute('aria-expanded')).toBe('false')
    expect(panels[1]!.hidden).toBe(true)
    expect(panels[0]!.hidden).toBe(false)
  })

  it('renders edited CMS toggles and shares comparison edits with desktop', () => {
    const edited = structuredClone(copy)
    edited.mobile.showDetails = 'Read programme details'
    edited.mobile.hideDetails = 'Close programme details'
    edited.programmes[1].comparison[0]!.body = 'Updated shared comparison'
    edited.programmes[1].comparison[0]!.label = 'Edited prize start label'
    edited.programmes[1].comparisonTag = 'Edited comparison tag'
    act(() => root.render(createElement(MobileProgrammes, edited)))
    const button = container.querySelector('button')!
    expect(button.textContent).toContain('Read programme details')
    act(() => button.click())
    expect(button.textContent).toContain('Close programme details')
    const props = {
      programmes: edited.programmes,
      heading: edited.comparisonHeading,
    }
    for (const Component of [MobileComparison, Comparison]) {
      act(() => root.render(createElement(Component, props)))
      for (const text of [
        'Updated shared comparison',
        'Edited prize start label',
        'Edited comparison tag',
      ]) {
        expect(container.textContent).toContain(text)
      }
    }
  })
})
