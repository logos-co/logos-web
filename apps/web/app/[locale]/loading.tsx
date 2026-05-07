/**
 * Default suspense fallback for every async page under `/[locale]`.
 * Kept intentionally minimal — pages that benefit from per-section
 * skeletons should add their own `loading.tsx` deeper in the route tree.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-[50vh] items-center justify-center py-20"
    >
      <div className="size-6 animate-spin rounded-full border-2 border-brand-dark-green/20 border-t-brand-dark-green" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
