'use client'

import {
  PickedCountry,
  pickedCityInputStyle,
  useCityAutocomplete,
  usePickedCountryWidth,
  type CitySearch,
  type CitySuggestion,
} from '@acid-info/logos-ui/client'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

import { TextInput } from './text-input'

type Props = Omit<
  ComponentProps<typeof TextInput>,
  'value' | 'onChange' | 'onSelect' | 'inputOverlay'
> & {
  /** The city name, the only editable part of the field. */
  value: string
  /** Country label of the picked suggestion, empty when not picked. */
  countryLabel: string
  search: CitySearch
  onChange: (value: string) => void
  /** Sets both the city and the country. */
  onSelect: (suggestion: CitySuggestion) => void
}

// Same font, padding and border width as `inputClassName`.
const pickedCountryClassName =
  'border border-transparent px-3 py-2.5 font-sans text-[16px] leading-[1.2]'

// A picked city reads in caps, like the country next to it.
const pickedCityClassName = 'uppercase'

// Same as the country in a suggestion.
const countryClassName = 'pl-1.5 uppercase text-brand-dark-green/50'

export function CityField({
  value,
  countryLabel,
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
  const { countryRef, countryWidth } = usePickedCountryWidth(countryLabel)

  return (
    <div className="relative w-full" ref={autocomplete.containerRef}>
      <TextInput
        {...props}
        value={value}
        style={pickedCityInputStyle('0.75rem', countryWidth, !!countryLabel)}
        onChange={(event) => {
          onChange(event.target.value)
          autocomplete.open()
        }}
        inputOverlay={
          <PickedCountry
            city={value}
            country={countryLabel}
            countryRef={countryRef}
            className={pickedCountryClassName}
            cityClassName={pickedCityClassName}
            countryClassName={countryClassName}
          />
        }
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
                <span className="ml-1.5 text-brand-dark-green/50 uppercase">
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
