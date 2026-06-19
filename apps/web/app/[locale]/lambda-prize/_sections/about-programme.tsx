import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'
import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'

import type { LambdaPrizePageCopy } from './types'

export function AboutProgramme({
  copy,
}: {
  copy: LambdaPrizePageCopy['about']
}) {
  return (
    <section className=" text-brand-dark-green">
      <ContentWidth className="bg-gray-01 mt-25 mb-0 flex min-h-[960px] flex-col gap-3 p-3 xl:mt-50 xl:h-[600px] xl:min-h-0 xl:flex-row">
        <div className="relative h-[405px] overflow-hidden rounded-3xl xl:h-full xl:w-[min(702px,50%)] xl:shrink-0">
          <Image
            src="/images/lambda-prize/about.webp"
            alt=""
            fill
            sizes="(min-width: 768px) 702px, 100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="flex min-h-[519px] min-w-0 flex-1 flex-col justify-between xl:h-full xl:min-h-0">
          <div className="flex flex-col items-start justify-between gap-3 xl:h-9 xl:flex-row xl:gap-0">
            <h2 className="text-h3-sans whitespace-nowrap">{copy.heading}</h2>
            <div className="flex gap-1">
              <Button
                href={EXTERNAL_URLS.lambdaPrizes}
                className="cursor-pointer"
              >
                {copy.primaryCta}
              </Button>
              <Button
                href={ROUTES.getStarted}
                variant="secondary"
                className="cursor-pointer"
              >
                {copy.secondaryCta}
              </Button>
            </div>
          </div>
          <p className="mx-auto w-full max-w-[345px] text-center font-sans text-[12px] leading-[1.2] font-medium text-brand-dark-green">
            {copy.body}
          </p>
          <div className="flex flex-col gap-3 text-brand-dark-green">
            {copy.rows.map((row, index) => (
              <div
                key={`${row.label}-${index}`}
                className="flex min-w-0 flex-col gap-1.5 border-t border-brand-dark-green/50 pt-1.5 xl:flex-row xl:gap-3"
              >
                <p className="text-eyebrow min-w-0 uppercase xl:w-[345px] xl:shrink-0">
                  {row.label}
                </p>
                <p className="text-mono-s min-w-0 break-words [overflow-wrap:anywhere]">
                  {row.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}
