import { describe, expect, it } from 'vitest'

import {
  TRACKABLE_BUTTON_SELECTOR,
  buildButtonClickEventName,
  buildButtonClickEventData,
  getButtonTrackingLabel,
  getTrackableButton,
  shouldTrackButtonClick,
} from '../umami-button-tracking'

interface FakeButtonOptions {
  readonly ariaLabel?: string
  readonly disabled?: boolean
  readonly excluded?: boolean
  readonly excludedAncestor?: boolean
  readonly id?: string
  readonly name?: string
  readonly textContent?: string
  readonly title?: string
}

const createButton = ({
  ariaLabel,
  disabled = false,
  excluded = false,
  excludedAncestor = false,
  id = '',
  name,
  textContent = '',
  title,
}: FakeButtonOptions = {}) => {
  const attributes = new Map<string, string>()

  if (ariaLabel) attributes.set('aria-label', ariaLabel)
  if (excluded) attributes.set('data-umami-button-tracking', 'off')
  if (name) attributes.set('name', name)
  if (title) attributes.set('title', title)

  return {
    classList: {
      contains: (className: string) => className === 'disabled' && disabled,
    },
    closest: (selector: string) =>
      selector === '[data-umami-button-tracking="off"]' && excludedAncestor
        ? {}
        : null,
    disabled,
    getAttribute: (name: string) => attributes.get(name) ?? null,
    id,
    textContent,
  } as unknown as HTMLElement
}

describe('getTrackableButton', () => {
  it('finds the closest button or link target', () => {
    const button = createButton()
    const target = {
      closest: (selector: string) =>
        selector === TRACKABLE_BUTTON_SELECTOR ? button : null,
    } as unknown as Element

    expect(getTrackableButton(target)).toBe(button)
  })

  it('returns null for non-DOM targets', () => {
    expect(getTrackableButton(null)).toBeNull()
    expect(getTrackableButton({})).toBeNull()
  })
})

describe('shouldTrackButtonClick', () => {
  it('tracks enabled buttons and links by default', () => {
    expect(shouldTrackButtonClick(createButton())).toBe(true)
  })

  it('skips disabled and explicitly excluded elements', () => {
    expect(shouldTrackButtonClick(createButton({ disabled: true }))).toBe(false)
    expect(shouldTrackButtonClick(createButton({ excluded: true }))).toBe(false)
    expect(shouldTrackButtonClick(createButton({ excludedAncestor: true }))).toBe(
      false
    )
  })
})

describe('getButtonTrackingLabel', () => {
  it('uses id before visible text', () => {
    expect(
      getButtonTrackingLabel(
        createButton({ id: 'join-cta', textContent: 'Join the movement' })
      )
    ).toBe('join-cta')
  })

  it('falls back through text, aria-label, name, title, and a generic label', () => {
    expect(
      getButtonTrackingLabel(createButton({ textContent: '  Learn   more  ' }))
    ).toBe('Learn more')
    expect(getButtonTrackingLabel(createButton({ ariaLabel: 'Open menu' }))).toBe(
      'Open menu'
    )
    expect(getButtonTrackingLabel(createButton({ name: 'newsletter' }))).toBe(
      'newsletter'
    )
    expect(getButtonTrackingLabel(createButton({ title: 'External link' }))).toBe(
      'External link'
    )
    expect(getButtonTrackingLabel(null)).toBe('button')
  })
})

describe('buildButtonClickEventName', () => {
  it('returns the extracted label', () => {
    expect(buildButtonClickEventName(createButton({ textContent: 'Subscribe' }))).toBe(
      'Subscribe'
    )
  })
})

describe('buildButtonClickEventData', () => {
  it('keeps pathname context in event data', () => {
    expect(buildButtonClickEventData('/builders-hub')).toEqual({
      source: '/builders-hub',
    })
  })
})
