import type { ReactNode } from 'react'

interface CenterCtaSectionProps {
  title: string
  body: string
  cta?: ReactNode
  className?: string
}

/**
 * Centred serif heading + mono body, with an optional CTA underneath. Used as
 * the lead-in above the Circles map on /movement and /build-the-parallel, and
 * as a standalone CTA block on /movement.
 */
export function CenterCtaSection({
  title,
  body,
  cta,
  className,
}: CenterCtaSectionProps) {
  return (
    <section
      className={`bg-brand-off-white px-3 py-25 text-center text-brand-dark-green ${className ?? ''}`}
    >
      <div className="mx-auto flex max-w-[456px] flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-h3-serif">{title}</h2>
          <p className="text-mono-s">{body}</p>
        </div>
        {cta}
      </div>
    </section>
  )
}
