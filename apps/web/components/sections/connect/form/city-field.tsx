'use client'

import {
  useCityAutocomplete,
  type CitySearch,
  type CitySuggestion,
} from '@acid-info/logos-ui/client'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

import { TextInput } from './text-input'

type Props = Omit<
  ComponentProps<typeof TextInput>,
  'value' | 'onChange' | 'onSelect'
> & {
  value: string
  search: CitySearch
  onChange: (value: string) => void
  /** Sets both the city and the country. */
  onSelect: (suggestion: CitySuggestion) => void
}

export function CityField({
  value,
  search,
  onChange,
  onSelect,
  ...props
}: Props) {
  const autocomplete = useCityAutocomplete({
    search,
    query: value,
    onSelect,
  })

  return (
    <div className="relative w-full" ref={autocomplete.containerRef}>
      <TextInput
        {...props}
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          autocomplete.open()
        }}
        {...autocomplete.inputProps}
      />
      {autocomplete.isOpen ? (
        <ul
          id={autocomplete.listId}
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 max-h-40 w-full overflow-y-auto rounded border border-brand-dark-green/20 bg-white shadow-lg"
        >
          {autocomplete.suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.name}|${suggestion.country}`}
              id={autocomplete.optionId(index)}
              role="option"
              aria-selected={index === autocomplete.activeIndex}
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => autocomplete.select(suggestion)}
                onMouseEnter={() => autocomplete.setActiveIndex(index)}
                className={cn(
                  'w-full px-3 py-2 text-left font-sans text-[14px] text-brand-dark-green',
                  index === autocomplete.activeIndex && 'bg-brand-dark-green/5'
                )}
              >
                {suggestion.name}
                <span className="ml-1.5 text-brand-dark-green/50">
                  {suggestion.country}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
