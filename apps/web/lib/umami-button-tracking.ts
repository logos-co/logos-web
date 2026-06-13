export const TRACKABLE_BUTTON_SELECTOR =
  'button, [role="button"], a, .button'

export interface ButtonClickEventData {
  readonly source: string
}

const normalizeLabel = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''

export function getTrackableButton(target: unknown): Element | null {
  if (
    !target ||
    typeof target !== 'object' ||
    !('closest' in target) ||
    typeof target.closest !== 'function'
  ) {
    return null
  }

  return target.closest(TRACKABLE_BUTTON_SELECTOR)
}

export function shouldTrackButtonClick(button: Element | null): boolean {
  if (!button) {
    return false
  }

  if (
    ('disabled' in button && button.disabled) ||
    button.classList?.contains('disabled') ||
    button.getAttribute('aria-disabled') === 'true'
  ) {
    return false
  }

  if (
    button.getAttribute('data-umami-button-tracking') === 'off' ||
    button.closest('[data-umami-button-tracking="off"]')
  ) {
    return false
  }

  return true
}

export function getButtonTrackingLabel(button: Element | null): string {
  if (!button) {
    return 'button'
  }

  return (
    normalizeLabel(button.id) ||
    normalizeLabel(button.textContent) ||
    normalizeLabel(button.getAttribute('aria-label')) ||
    normalizeLabel(button.getAttribute('name')) ||
    normalizeLabel(button.getAttribute('title')) ||
    'button'
  )
}

export function buildButtonClickEventName(button: Element | null): string {
  return getButtonTrackingLabel(button)
}

export function buildButtonClickEventData(
  pathname: string
): ButtonClickEventData {
  return { source: pathname }
}
