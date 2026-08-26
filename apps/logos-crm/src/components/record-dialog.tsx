'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Dialog, Modal, ModalOverlay } from 'react-aria-components'

/**
 * How long the panel takes to leave. Mirrors `--dialog-exit` in the stylesheet;
 * the two are kept in step because the parent unmounts this component, so the
 * exit has to be timed here rather than left to the animation alone.
 */
const EXIT_MS = 200

interface RecordDialogProps {
  children: ReactNode
  kicker: string
  onClose: () => void
  title: string
}

/**
 * Closing runs in two steps.
 *
 * Every caller mounts this conditionally, so telling the parent immediately
 * would tear the panel out mid-slide and it would vanish rather than leave.
 * Instead the overlay is closed first - React Aria plays the exit animation on
 * `[data-exiting]` - and the parent is told once that has had time to finish,
 * which is also what resets the form for the next open.
 */
export function RecordDialog({
  children,
  kicker,
  onClose,
  title,
}: RecordDialogProps) {
  const titleId = `dialog-${title.toLocaleLowerCase('en').replace(/[^a-z0-9]+/g, '-')}`
  const [isOpen, setOpen] = useState(true)
  const timeout = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timeout.current), [])

  function requestClose(): void {
    // Guarded: a second Close while the first is still animating would queue a
    // second `onClose` against a parent that has already moved on.
    if (!isOpen) return
    setOpen(false)
    timeout.current = window.setTimeout(onClose, EXIT_MS)
  }

  return (
    <ModalOverlay
      className="dialog-backdrop"
      isDismissable={false}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) requestClose()
      }}
    >
      <Modal className="dialog-modal">
        <Dialog
          aria-labelledby={titleId}
          className="dialog-panel"
          role="dialog"
        >
          <div className="dialog-header">
            <div>
              <p className="utility-label">{kicker}</p>
              <h2 id={titleId}>{title}</h2>
            </div>
            <button
              className="text-action cursor-pointer"
              type="button"
              onClick={requestClose}
            >
              Close
            </button>
          </div>
          {children}
        </Dialog>
      </Modal>
    </ModalOverlay>
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
