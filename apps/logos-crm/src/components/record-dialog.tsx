'use client'

import type { ReactNode } from 'react'

interface RecordDialogProps {
  children: ReactNode
  kicker: string
  onClose: () => void
  title: string
}

export function RecordDialog({
  children,
  kicker,
  onClose,
  title,
}: RecordDialogProps) {
  const titleId = `dialog-${title.toLocaleLowerCase('en').replace(/[^a-z0-9]+/g, '-')}`

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="dialog-panel"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <p className="utility-label">{kicker}</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            className="text-action cursor-pointer"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

export function FormField({
  children,
  error,
  label,
}: {
  children: ReactNode
  error?: string
  label: string
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  )
}
