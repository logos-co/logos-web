import Image from 'next/image'
import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

import type { LambdaPrizePageCopy } from './types'

export function Hero({ copy }: { copy: LambdaPrizePageCopy['hero'] }) {
  const headingLines = copy.heading.split('\n')

  return (
    <section className="relative h-[800px] overflow-hidden bg-brand-dark-green px-3 pt-10 text-brand-off-white">
      <Image
        src="/images/lambda-prize/hero.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover blur-[2px] grayscale"
        priority
      />
      <div className="absolute inset-0 bg-brand-dark-green/35" />
      <ContentWidth className="relative z-10 flex h-full items-center justify-center">
        <div className="flex w-full -translate-y-[6px] flex-col items-center text-center">
          <div className="text-h4-serif mb-12 inline-flex items-center gap-3">
            <LogosMark size={20} />
            <span>{copy.label}</span>
          </div>
          <h1 className="w-full max-w-[369px] font-display text-[40px] leading-none tracking-[-0.03em] lg:max-w-none lg:text-[56px] lg:leading-[0.88]">
            {headingLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="text-mono-s mt-12 w-full max-w-[345px] lg:w-[462px] lg:max-w-full">
            <span className="inline-flex items-baseline gap-1">
              <LogosMark size={7} className="shrink-0" />
              <span>{copy.body}</span>
            </span>
          </p>
          <div className="mt-15 flex gap-1">
            <Button
              href={ROUTES.rfps}
              className="cursor-pointer bg-brand-off-white text-brand-dark-green"
            >
              {copy.primaryCta}
            </Button>
            <Button
              href={ROUTES.buildersHub}
              variant="secondary"
              className="cursor-pointer border-brand-off-white/50 text-brand-off-white"
            >
              {copy.secondaryCta}
            </Button>
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}
