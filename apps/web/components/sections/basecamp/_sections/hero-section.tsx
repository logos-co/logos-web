import type { HeroSection } from '@repo/content/schemas'
import { LogosMark } from '@acid-info/logos-ui'

import { IconMask } from '@/components/icons/icon-mask'
import { Button } from '@/components/ui'

import { BasecampCta, paragraphs } from './atoms'

export function HeroSectionView({ data }: { data: HeroSection }) {
  const bodyDetails = paragraphs(data.bodySecondary)

  return (
    <section className="grid w-full grid-cols-1 gap-12 px-3 pt-8 pb-12 md:min-h-[453px] md:grid-cols-2 md:gap-6 md:pb-10">
      <div className="flex flex-col items-start gap-10">
        {data.eyebrow ? (
          <Button
            href="/technology-stack"
            variant="tertiary"
            icon={
              <IconMask
                src="/icons/arrow-right.svg"
                className="order-first size-[14px] rotate-180"
              />
            }
            className="cursor-pointer px-0 py-0"
          >
            {data.eyebrow}
          </Button>
        ) : null}
        <h1 className="text-h3 flex items-center gap-3 text-brand-dark-green">
          <LogosMark size={26} className="shrink-0" />
          {data.headline}
        </h1>
      </div>

      <div className="flex max-w-[393px] flex-col gap-6">
        {data.body ? (
          <p className="text-mono-s max-w-[342px] text-brand-dark-green">
            {data.body}
          </p>
        ) : null}
        {bodyDetails.length > 0 ? (
          <div className="text-mono-s flex max-w-[342px] flex-col gap-4 text-brand-dark-green">
            {bodyDetails.map((item) => (
              <p key={item} className="whitespace-pre-line">
                {item}
              </p>
            ))}
          </div>
        ) : null}
        <div className="h-px w-full bg-brand-dark-green/10" />
        {data.ctas ? (
          <div className="flex flex-col items-start gap-6">
            {data.ctas.map((cta) => (
              <BasecampCta
                key={cta.label}
                cta={cta}
                className="cursor-pointer"
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
