import type { CirclesSettings } from '@repo/content/schemas'

import { Button } from '@/components/ui'

export function NearbyCta({ settings }: { settings: CirclesSettings }) {
  return (
    <section className="bg-brand-off-white px-3 pb-25 pt-10 text-center md:pb-20 md:pt-1">
      <div className="mx-auto flex max-w-[464px] flex-col items-center gap-4 text-brand-dark-green md:gap-4">
        <h2 className="font-display text-[30px] leading-none md:text-[36px]">
          {settings.nearbyCta.title}
        </h2>
        {settings.nearbyCta.description ? (
          <p className="text-mono-s max-w-[345px]">
            {settings.nearbyCta.description}
          </p>
        ) : null}
        <Button
          href={settings.nearbyCta.cta.href}
          className="px-3 py-2"
          {...(settings.nearbyCta.cta.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {settings.nearbyCta.cta.label}
        </Button>
      </div>
    </section>
  )
}
