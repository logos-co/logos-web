import type { CTA } from '@repo/content/schemas'

import { Button } from '@/components/ui'

type Props = {
  title: string
  cta: CTA
}

/**
 * Bottom call-to-action panel rendered below RFPs / Ideas listing pages.
 * Shape: large heading + single CTA button on a flat background.
 */
export function BuildersHubBottomCta({ title, cta }: Props) {
  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white">
      <div className="mx-auto flex max-w-360 flex-col items-center gap-6 px-3 py-25 text-center">
        <h2 className="text-h3-serif text-brand-dark-green text-balance max-w-[20ch] md:max-w-[24ch]">
          {title}
        </h2>
        <Button
          href={cta.href}
          variant="primary"
          {...(cta.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {cta.label}
        </Button>
      </div>
    </section>
  )
}
