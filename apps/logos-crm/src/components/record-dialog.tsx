'use client'

import type { ReactNode } from 'react'
import { Dialog, Modal, ModalOverlay } from 'react-aria-components'

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
    <ModalOverlay
      className="dialog-backdrop"
      isDismissable={false}
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose()
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
              onClick={onClose}
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
