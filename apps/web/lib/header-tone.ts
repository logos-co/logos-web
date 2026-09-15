/**
 * Lets a hero page keep the header's light ink over dark sections that run
 * past the first viewport. The page marks those sections with
 * `data-header-tone="dark"`; the header stays light while its vertical middle
 * sits inside one of them.
 */

export const DARK_HEADER_ZONE_SELECTOR = '[data-header-tone="dark"]'

/** Vertical middle of the closed header bar (40px mobile, 42px desktop). */
export const HEADER_TONE_PROBE_Y = 20

type VerticalBounds = Pick<DOMRect, 'top' | 'bottom'>

export function isProbeOverDarkZone(
  zones: readonly VerticalBounds[],
  probeY: number = HEADER_TONE_PROBE_Y
): boolean {
  return zones.some((zone) => zone.top <= probeY && zone.bottom > probeY)
}
