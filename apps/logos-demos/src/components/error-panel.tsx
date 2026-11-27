'use client'

import { Button } from '@acid-info/logos-ui'

interface ErrorPanelProps {
  message: string
  reset: () => void
}

export function ErrorPanel({ message, reset }: ErrorPanelProps) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-6 py-12 md:py-16">
      <p role="alert" className="text-body-sans text-brand-dark-green">
        {message}
      </p>
      <Button
        type="button"
        variant="primary"
        icon={false}
        onClick={reset}
        className="cursor-pointer"
      >
        Try again
      </Button>
    </div>
  )
}
