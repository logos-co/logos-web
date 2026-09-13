import Image from 'next/image'
import { LogosMark } from '@acid-info/logos-ui'

import { CampaignHero } from '@/components/sections/shared/campaign-hero'
import { Button } from '@/components/ui'
import { LambdaLockup } from '@/components/ui/lambda-lockup'
import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'

import type { LambdaPrizePageCopy } from './types'

export function Hero({ copy }: { copy: LambdaPrizePageCopy['hero'] }) {
  const headingLines = copy.heading.split('\n')

  return (
    <CampaignHero
      background={
        <>
          <Image
            src="/images/lambda-prize/hero.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover blur-[2px] grayscale"
            priority
          />
          <div className="absolute inset-0 bg-brand-dark-green/35" />
        </>
      }
    >
      <LambdaLockup className="text-h4-serif mb-12 [--lockup-font-size:24px]">
        <span>{copy.label}</span>
      </LambdaLockup>
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
          href={EXTERNAL_URLS.lambdaPrizes}
          className="cursor-pointer bg-brand-off-white text-brand-dark-green"
        >
          {copy.primaryCta}
        </Button>
        <Button
          href={ROUTES.getStarted}
          variant="secondary"
          className="cursor-pointer border-brand-off-white/50 text-brand-off-white"
        >
          {copy.secondaryCta}
        </Button>
      </div>
    </CampaignHero>
  )
}
