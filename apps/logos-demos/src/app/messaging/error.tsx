'use client'

import { ErrorPanel } from '@/components/error-panel'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <ErrorPanel
      message="The chat stopped working. Try again to reconnect."
      reset={reset}
    />
  )
}
