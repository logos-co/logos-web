'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'

/**
 * Width of the picked country label, so the city input can reserve room for
 * it on the right. Zero while no country is shown.
 */
export function usePickedCountryWidth(country: string) {
  const countryRef = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const element = countryRef.current
    if (!country || !element) {
      setWidth(0)
      return
    }

    // Rounded down, so the input never gets narrower than the city.
    const update = () =>
      setWidth(Math.floor(element.getBoundingClientRect().width))
    update()
    // Web fonts can load after the first measure.
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [country])

  return { countryRef, countryWidth: width }
}

/**
 * Styles for the city input while a city is picked (`isPicked`): room on the
 * right for the country label (its own padding plus the label, so a centred
 * city stays lined up with the overlay) and the caps the picked city reads in.
 * The padding waits for the first measurement. Display only, so the input
 * value keeps the city's own casing.
 */
export function pickedCityInputStyle(
  basePadding: string,
  countryWidth: number,
  isPicked: boolean
): CSSProperties {
  if (!isPicked) return {}
  return {
    paddingRight: countryWidth
      ? `calc(${basePadding} + ${countryWidth}px)`
      : undefined,
    textTransform: 'uppercase',
  }
}

export type PickedCountryProps = {
  /** The city text in the input. Rendered invisibly to place the country. */
  city: string
  country: string
  countryRef: RefObject<HTMLSpanElement | null>
  /**
   * Must match the input's font, padding, border width and text alignment,
   * so the country lands right after the typed city.
   */
  className: string
  /** City style. Must match the input while it shows the picked city. */
  cityClassName?: string
  /** Country style; put the gap to the city in padding so it is measured. */
  countryClassName: string
}

/**
 * The picked country, drawn over the city input after the city text. It is
 * not part of the input value, so only the city can be edited. The input's
 * right padding follows the country's rendered width, so a long country
 * truncates while the city keeps the room it needs. Pass `cityClassName` the
 * input's own casing, so the invisible city measures as wide as the real one.
 */
export function PickedCountry({
  city,
  country,
  countryRef,
  className,
  cityClassName,
  countryClassName,
}: PickedCountryProps) {
  if (!country) return null

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre ${className}`}
    >
      <span className={`invisible shrink-0 ${cityClassName ?? ''}`}>
        {city}
      </span>
      {/* Shrinks with an ellipsis in a narrow field; the city stays whole. */}
      <span ref={countryRef} className={`min-w-0 truncate ${countryClassName}`}>
        {country}
      </span>
    </span>
  )
}
