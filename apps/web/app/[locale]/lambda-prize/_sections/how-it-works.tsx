import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'
import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'

import { DataRows } from './atoms'
import type { LambdaPrizePageCopy } from './types'

export function HowItWorks({
  copy,
  evaluation,
}: {
  copy: LambdaPrizePageCopy['howItWorks']
  evaluation: LambdaPrizePageCopy['evaluation']
}) {
  return (
    <section className="bg-brand-off-white text-brand-dark-green">
      <ContentWidth className="flex flex-col gap-4 p-3 lg:grid lg:h-[650px] lg:grid-cols-2 lg:gap-6 lg:px-3 lg:py-10">
        <div className="order-2 flex min-h-[687px] flex-col justify-between lg:order-1 lg:min-h-0">
          <div className="flex flex-col gap-10 lg:gap-20">
            <div>
              <h2 className="text-h4-serif mb-8">{copy.heading}</h2>
              <DataRows rows={copy.rows} />
            </div>
            <div>
              <h2 className="text-h4-serif mb-8">{evaluation.heading}</h2>
              <DataRows rows={evaluation.rows} />
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              href={EXTERNAL_URLS.lambdaPrizes}
              className="cursor-pointer"
            >
              {evaluation.primaryCta}
            </Button>
            <Button
              href={ROUTES.buildersHub}
              variant="secondary"
              className="cursor-pointer"
            >
              {evaluation.secondaryCta}
            </Button>
          </div>
        </div>
        <div className="relative order-1 h-[626px] overflow-hidden lg:order-2 lg:h-auto">
          <Image
            src="/images/lambda-prize/how-it-works.webp"
            alt=""
            fill
            sizes="50vw"
            className="rounded-xl object-cover object-left lg:object-center"
          />
        </div>
      </ContentWidth>
    </section>
  )
}
