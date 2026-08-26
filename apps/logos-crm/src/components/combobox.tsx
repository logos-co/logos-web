'use client'

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

export interface ComboboxOption {
  id: string
  label: string
  /** Secondary text shown after the label, e.g. the person's organisation. */
  hint?: string
}

interface ComboboxProps {
  label: string
  options: readonly ComboboxOption[]
  /** Selected option id, or null for none. */
  value: string | null
  onChange: (id: string | null) => void
  /**
   * Called when the typed text matches nothing and the user commits it. Leave
   * undefined for a pick-only field: the create affordance then never appears,
   * rather than appearing and failing.
   */
  onCreate?: (label: string) => void
  placeholder?: string
  /**
   * What to show while closed when `value` matches no option.
   *
   * Some fields are keyed by name rather than by id - the organisation on a
   * case is resolved server-side, so a name the user just typed has no id yet.
   * Without this the field went blank the moment somebody created one, which
   * looks like the entry was thrown away.
   */
  displayValue?: string
  /** Label for the "nothing selected" row. Omit to make a choice mandatory. */
  emptyOptionLabel?: string
  disabled?: boolean
  invalid?: boolean
}

const EMPTY_ID = '__empty__'
const CREATE_ID = '__create__'

function normalise(value: string): string {
  return value.trim().toLocaleLowerCase('en')
}

/**
 * A searchable select that can also create.
 *
 * A native `<select>` cannot do either: its list is not filterable, and the
 * only way to enter something that is not already in it is to leave the form,
 * create the record, and come back. That round trip is how leads end up
 * recorded nowhere, which is the whole reason this field is here.
 *
 * Built on the ARIA combobox pattern rather than a library so the keyboard
 * contract is explicit: typing filters, Up/Down moves, Enter commits the
 * highlighted row - including the "Add" row - and Escape closes without
 * changing anything.
 */
export function Combobox({
  label,
  options,
  value,
  onChange,
  onCreate,
  placeholder,
  displayValue,
  emptyOptionLabel,
  disabled = false,
  invalid = false,
}: ComboboxProps) {
  const id = useId()
  const listId = `${id}-list`
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [isOpen, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const selected = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value]
  )

  /**
   * The input shows the selection while closed and the search term while open.
   * Keeping the selection visible when closed is what makes this read as a
   * select rather than as a text field somebody half-filled.
   */
  const inputValue = isOpen ? query : (selected?.label ?? displayValue ?? '')

  const matches = useMemo(() => {
    const needle = normalise(query)
    if (!needle) return options
    return options.filter(
      (option) =>
        normalise(option.label).includes(needle) ||
        (option.hint ? normalise(option.hint).includes(needle) : false)
    )
  }, [options, query])

  /**
   * The typed term is offered as a new record only when it matches nothing
   * exactly. Offering "Add Waku" while an option called Waku is on screen is
   * how duplicates get made.
   */
  const canCreate =
    onCreate !== undefined &&
    query.trim().length >= 2 &&
    !options.some((option) => normalise(option.label) === normalise(query))

  const rows = useMemo(() => {
    const list: ComboboxOption[] = []
    if (emptyOptionLabel && !query.trim()) {
      list.push({ id: EMPTY_ID, label: emptyOptionLabel })
    }
    list.push(...matches)
    if (canCreate) {
      list.push({ id: CREATE_ID, label: `Add “${query.trim()}”` })
    }
    return list
  }, [emptyOptionLabel, query, matches, canCreate])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onPointerDown(event: PointerEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isOpen])

  const commit = useCallback(
    (row: ComboboxOption | undefined): void => {
      if (!row) return
      if (row.id === CREATE_ID) onCreate?.(query.trim())
      else onChange(row.id === EMPTY_ID ? null : row.id)
      setOpen(false)
      setQuery('')
      inputRef.current?.focus()
    },
    [onChange, onCreate, query]
  )

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (disabled) return

    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      event.preventDefault()
      setOpen(true)
      return
    }
    if (!isOpen) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((index) => (index + 1) % Math.max(rows.length, 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex(
          (index) => (index - 1 + rows.length) % Math.max(rows.length, 1)
        )
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(Math.max(rows.length - 1, 0))
        break
      case 'Enter':
        // Never submits the surrounding form: Enter here means "take this
        // row", and a form that saved on the same keystroke would commit a
        // record the user was still filling in.
        event.preventDefault()
        commit(rows[activeIndex])
        break
      case 'Escape':
        // Stopped here, not just prevented: the dialog this usually sits in
        // closes on Escape too, so without this a user dismissing the dropdown
        // loses every field they had already filled in.
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
        setQuery('')
        break
      case 'Tab':
        setOpen(false)
        setQuery('')
        break
      default:
        break
    }
  }

  const activeRow = rows[activeIndex]

  return (
    <div className="combobox" ref={containerRef}>
      <input
        aria-activedescendant={
          isOpen && activeRow ? `${id}-opt-${activeIndex}` : undefined
        }
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={isOpen}
        aria-invalid={invalid || undefined}
        aria-label={label}
        autoComplete="off"
        className="combobox-input"
        disabled={disabled}
        id={id}
        placeholder={placeholder}
        ref={inputRef}
        role="combobox"
        type="text"
        value={inputValue}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      <button
        aria-label={isOpen ? `Close ${label} options` : `Open ${label} options`}
        className="combobox-toggle cursor-pointer"
        data-open={isOpen ? 'true' : 'false'}
        disabled={disabled}
        tabIndex={-1}
        type="button"
        onClick={() => {
          setOpen((open) => !open)
          inputRef.current?.focus()
        }}
      >
        {/*
          Drawn rather than typed. The `▾` glyph renders at whatever size and
          weight the fallback font decides, which came out faint enough to be
          easy to miss - the one mark telling you this field has a list behind
          it. An SVG stroke is the same everywhere and can turn to point up
          when the list is open.
        */}
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          viewBox="0 0 16 16"
          width="16"
        >
          <path
            d="M4 6.5 8 10.5 12 6.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </svg>
      </button>

      {isOpen && (
        <ul className="combobox-list" id={listId} role="listbox">
          {rows.map((row, index) => (
            <li
              aria-selected={
                row.id === CREATE_ID
                  ? undefined
                  : row.id === (value ?? EMPTY_ID)
              }
              className={`combobox-option ${index === activeIndex ? 'active' : ''} ${row.id === CREATE_ID ? 'is-create' : ''}`}
              id={`${id}-opt-${index}`}
              key={row.id}
              role="option"
              // pointerdown rather than click: the outside-click listener runs
              // on pointerdown and would close the list before a click landed.
              onPointerDown={(event) => {
                event.preventDefault()
                commit(row)
              }}
              onPointerEnter={() => setActiveIndex(index)}
            >
              <span>{row.label}</span>
              {row.hint && <small>{row.hint}</small>}
            </li>
          ))}

          {rows.length === 0 && (
            <li className="combobox-empty">
              {onCreate
                ? 'Nothing matches. Type at least two characters to add one.'
                : 'Nothing matches.'}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
