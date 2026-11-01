/**
 * View-mode switcher — `Grid / List` labels with a slash separator.
 * Inactive option is dimmed; active option is full-strength and underlined.
 *
 * Used on /builders-hub/ideas (default: list) and /rfp (default: grid).
 *
 *   <ViewToggle
 *     view="grid"
 *     options={[{ id: 'grid', label: 'Grid' }, { id: 'list', label: 'List' }]}
 *     onChange={setView}
 *   />
 */
import type { ReactNode } from 'react'

export type ViewOption<Id extends string = string> = {
  id: Id
  label: ReactNode
}

type BaseProps<Id extends string> = {
  options: ViewOption<Id>[]
  /** Currently active option id. */
  view: Id
  className?: string
}

type HrefProps<Id extends string> = BaseProps<Id> & {
  getHref: (id: Id) => string
  onChange?: never
}

type ClickProps<Id extends string> = BaseProps<Id> & {
  onChange: (id: Id) => void
  getHref?: never
}

export type ViewToggleProps<Id extends string = string> =
  | HrefProps<Id>
  | ClickProps<Id>

export function ViewToggle<Id extends string = string>(
  props: ViewToggleProps<Id>
) {
  const { options, view, className } = props

  const renderOption = (opt: ViewOption<Id>) => {
    const isActive = opt.id === view
    const labelClass = `text-body-sans transition-colors ${
      isActive
        ? 'text-brand-dark-green underline underline-offset-4'
        : 'text-brand-dark-green/50 hover:text-brand-dark-green'
    }`

    if ('getHref' in props && props.getHref) {
      return (
        <a
          key={opt.id}
          href={props.getHref(opt.id)}
          aria-current={isActive ? 'true' : undefined}
          className={labelClass}
        >
          {opt.label}
        </a>
      )
    }
    return (
      <button
        key={opt.id}
        type="button"
        onClick={() => 'onChange' in props && props.onChange?.(opt.id)}
        aria-pressed={isActive}
        className={labelClass}
      >
        {opt.label}
      </button>
    )
  }

  return (
    <div
      role="group"
      aria-label="View mode"
      className={`inline-flex items-center gap-3 ${className ?? ''}`}
    >
      {options.map((opt, i) => (
        <span key={opt.id} className="inline-flex items-center gap-3">
          {renderOption(opt)}
          {i < options.length - 1 && (
            <span aria-hidden="true" className="text-brand-dark-green/40">
              /
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
