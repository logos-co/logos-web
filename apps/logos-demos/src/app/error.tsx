'use client'

import { ErrorPanel } from '@/components/error-panel'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <ErrorPanel message="Something went wrong on this page." reset={reset} />
  )
}
