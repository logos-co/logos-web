/**
 * Placeholders that hold the shape of what is coming.
 *
 * These demos read live networks, and the wait is real: a testnet node round
 * trip, a roster fetch, a light node finding peers. Showing nothing and then
 * everything makes the page look broken and then startling. A placeholder the
 * same size as the answer means the layout never moves.
 */

/** One line of text that has not arrived. */
export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`skeleton block h-[1em] rounded-[2px] ${className}`}
    />
  )
}

/**
 * A labelled value, the shape `Stat` renders.
 *
 * The label is real text, because it is known before the value is: only the
 * number is missing, and saying so is more use than a grey box.
 */
export function SkeletonStat({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label text-gray-05">{label}</span>
      <SkeletonLine className="text-h4-sans w-16" />
    </div>
  )
}

/** A card standing in for one that will arrive, with the same padding. */
export function SkeletonCard({
  lines = 3,
  className = '',
}: {
  lines?: number
  className?: string
}) {
  return (
    <div
      className={`flex flex-col gap-3 border border-gray-01 bg-white p-4 ${className}`}
    >
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="flex flex-col gap-1">
          <SkeletonLine className="text-label w-20" />
          <SkeletonLine className="text-body-sans w-full max-w-64" />
        </div>
      ))}
    </div>
  )
}
