export const TRACKABLE_BUTTON_SELECTOR = 'button, [role="button"], a, .button'

export interface ButtonClickEventData {
  readonly source: string
}

/** Matches the ` - ` already used by hand-written event names. */
const SEGMENT_SEPARATOR = ' - '

const normalizeLabel = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''

/**
 * Joins the rendered lines of a label with a dash, so a card that stacks a
 * heading above its CTA reads as `Explore the Tech - Get Started` rather than
 * the run-together `Explore the TechGet Started`.
 */
const normalizeVisibleLabel = (value: unknown): string =>
  typeof value === 'string'
    ? value
        .split(/\r?\n+/)
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join(SEGMENT_SEPARATOR)
    : ''

/**
 * `innerText` reflects the rendered line boxes, so it is the only source that
 * knows where one piece of copy ends and the next begins. It is missing
 * outside a real layout engine, where `textContent` is the best available
 * fallback.
 */
const getVisibleLabel = (button: Element): string => {
  const innerText = (button as HTMLElement).innerText

  return normalizeVisibleLabel(
    typeof innerText === 'string' ? innerText : button.textContent
  )
}

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

export function getButtonTrackingLabel(button: Element | null): string | null {
  if (!button) {
    return null
  }

  return (
    normalizeLabel(button.getAttribute('data-umami-event-name')) ||
    normalizeLabel(
      button
        .querySelector('[data-umami-event-name]')
        ?.getAttribute('data-umami-event-name')
    ) ||
    normalizeLabel(button.id) ||
    getVisibleLabel(button) ||
    normalizeLabel(button.getAttribute('aria-label')) ||
    normalizeLabel(button.getAttribute('name')) ||
    normalizeLabel(button.getAttribute('title')) ||
    null
  )
}

export function buildButtonClickEventName(
  button: Element | null
): string | null {
  return getButtonTrackingLabel(button)
}

export function buildButtonClickEventData(
  pathname: string
): ButtonClickEventData {
  return { source: pathname }
}
