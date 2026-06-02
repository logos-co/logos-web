'use client'

/**
 * Default error boundary for every page under `/[locale]`.
 * Catches runtime + data-fetch failures (e.g. blog API down, Hasura
 * unreachable). Renders a user-facing message and a `reset` retry.
 *
 * Add deeper `error.tsx` files (e.g. inside `/blog`) when a route needs
 * a more specific recovery affordance.
 */
import { useEffect } from 'react'

type ErrorBoundaryProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Surface to the browser console for local debugging; production logging
    // should hook into the same logger module the server side uses.
    if (process.env.NODE_ENV !== 'production') {
      console.error(error)
    }
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-20 text-center text-brand-dark-green">
      <h1 className="font-display text-[40px] leading-none md:text-[56px]">
        Something went wrong
      </h1>
      <p className="text-mono-s max-w-md">
        We hit an unexpected issue while loading this page. Please try again —
        the issue may resolve on retry.
      </p>
      <button
        type="button"
        onClick={reset}
        className="text-mono-s cursor-pointer border border-brand-dark-green px-4 py-2 uppercase transition-opacity hover:opacity-70"
      >
        Try again
      </button>
    </div>
  )
}
