'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

export type CitySuggestion = {
  name: string
  /** A country value of the calling form, set along with the city on pick. */
  country: string
}

/**
 * Suggestions for `query`, within `country` when it is set. Should resolve to
 * an empty list rather than reject: the field stays free text either way.
 */
export type CitySearch = (
  query: string,
  country: string,
  signal: AbortSignal
) => Promise<readonly CitySuggestion[]>

export const CITY_SEARCH_MIN_LENGTH = 2
export const CITY_SEARCH_DEBOUNCE_MS = 250

export type UseCityAutocompleteOptions = {
  /** Without one, the field is plain free text. */
  search?: CitySearch
  /** The current city value. */
  query: string
  country: string
  onSelect: (suggestion: CitySuggestion) => void
}

/**
 * Headless city combobox: debounced search, keyboard navigation and outside
 * click. Rendering stays with the caller, so each form keeps its own styles.
 */
export function useCityAutocomplete({
  search,
  query,
  country,
  onSelect,
}: UseCityAutocompleteOptions) {
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const pickedRef = useRef<CitySuggestion | null>(null)
  const [results, setResults] = useState<readonly CitySuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const trimmed = query.trim()
  const suggestions =
    trimmed.length >= CITY_SEARCH_MIN_LENGTH ? results : NO_SUGGESTIONS
  const isListOpen = isOpen && suggestions.length > 0

  useEffect(() => {
    const picked = pickedRef.current
    if (
      !search ||
      trimmed.length < CITY_SEARCH_MIN_LENGTH ||
      (picked?.name === trimmed && picked.country === country)
    ) {
      return
    }

    // Aborted on the next keystroke, so a slow answer never replaces a newer one.
    const controller = new AbortController()
    const timer = setTimeout(() => {
      search(trimmed, country, controller.signal).then(
        (found) => {
          if (controller.signal.aborted) return
          setResults(found)
          setActiveIndex(-1)
        },
        () => {}
      )
    }, CITY_SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [search, trimmed, country])

  const close = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(-1)
  }, [])

  useEffect(() => {
    if (!isListOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close()
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isListOpen, close])

  useEffect(() => {
    if (isListOpen && activeIndex >= 0) {
      document
        .getElementById(`${listId}-${activeIndex}`)
        ?.scrollIntoView({ block: 'nearest' })
    }
  }, [isListOpen, activeIndex, listId])

  /** Call on every keystroke in the city field. */
  const open = useCallback(() => {
    pickedRef.current = null
    setIsOpen(true)
    setActiveIndex(-1)
  }, [])

  const select = (suggestion: CitySuggestion) => {
    pickedRef.current = suggestion
    close()
    onSelect(suggestion)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        if (!suggestions.length) return
        event.preventDefault()
        setIsOpen(true)
        setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        if (!isListOpen) return
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
        break
      case 'Enter': {
        // Without a highlighted suggestion, Enter submits the typed text.
        const suggestion = isListOpen ? suggestions[activeIndex] : undefined
        if (!suggestion) return
        event.preventDefault()
        select(suggestion)
        break
      }
      case 'Escape':
        if (!isListOpen) return
        event.preventDefault()
        close()
        break
      case 'Tab':
        close()
        break
    }
  }

  const optionId = (index: number) => `${listId}-${index}`

  return {
    containerRef,
    suggestions,
    isOpen: isListOpen,
    activeIndex,
    setActiveIndex,
    listId,
    optionId,
    open,
    close,
    select,
    inputProps: {
      role: 'combobox',
      autoComplete: 'off',
      'aria-autocomplete': 'list',
      'aria-expanded': isListOpen,
      'aria-controls': listId,
      'aria-activedescendant':
        isListOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined,
      onKeyDown: handleKeyDown,
    },
  } as const
}

const NO_SUGGESTIONS: readonly CitySuggestion[] = []
