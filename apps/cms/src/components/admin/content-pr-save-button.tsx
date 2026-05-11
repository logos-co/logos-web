'use client'

import {
  FormSubmit,
  toast,
  useDocumentInfo,
  useEditDepth,
  useForm,
  useFormModified,
  useFormProcessing,
  useHotkey,
  useOperation,
  useTranslation,
} from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'

const toastId = 'content-pr-save-in-progress'

const LoadingIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    height="14"
    viewBox="0 0 16 16"
    width="14"
  >
    <circle
      cx="8"
      cy="8"
      fill="none"
      opacity="0.3"
      r="6"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M14 8a6 6 0 0 0-6-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
    >
      <animateTransform
        attributeName="transform"
        dur="0.8s"
        from="0 8 8"
        repeatCount="indefinite"
        to="360 8 8"
        type="rotate"
      />
    </path>
  </svg>
)

export const ContentPrSaveButton = () => {
  const { uploadStatus } = useDocumentInfo()
  const { submit } = useForm()
  const { t } = useTranslation()
  const modified = useFormModified()
  const processing = useFormProcessing()
  const editDepth = useEditDepth()
  const operation = useOperation()
  const ref = useRef<HTMLButtonElement | null>(null)
  const sawProcessingRef = useRef(false)
  const [showFeedback, setShowFeedback] = useState(false)

  const disabled =
    (operation === 'update' && !modified) || uploadStatus === 'uploading'
  const pending = showFeedback || processing

  const startFeedback = () => {
    setShowFeedback(true)
    sawProcessingRef.current = false
    toast.loading('Creating pull request...', { id: toastId })
  }

  const stopFeedback = () => {
    setShowFeedback(false)
    sawProcessingRef.current = false
    toast.dismiss(toastId)
  }

  useEffect(() => {
    if (!showFeedback) return

    if (processing) {
      sawProcessingRef.current = true
      return
    }

    const timeout = window.setTimeout(
      stopFeedback,
      sawProcessingRef.current ? 0 : 800
    )

    return () => window.clearTimeout(timeout)
  }, [processing, showFeedback])

  useHotkey(
    {
      cmdCtrlKey: true,
      editDepth,
      keyCodes: ['s'],
    },
    (event) => {
      event.preventDefault()
      event.stopPropagation()

      if (!disabled) {
        ref.current?.click()
      }
    }
  )

  const handleSubmit = () => {
    if (uploadStatus === 'uploading') return

    startFeedback()
    return void submit()
  }

  return (
    <FormSubmit
      buttonId="action-save"
      disabled={disabled}
      extraButtonProps={{ style: { minWidth: 120 } }}
      onClick={handleSubmit}
      ref={ref}
      size="medium"
      type="button"
    >
      <span
        style={{
          alignItems: 'center',
          display: 'inline-flex',
          gap: 8,
          justifyContent: 'center',
        }}
      >
        {pending ? <LoadingIcon /> : null}
        <span>{pending ? 'Creating PR...' : t('general:save')}</span>
      </span>
    </FormSubmit>
  )
}
