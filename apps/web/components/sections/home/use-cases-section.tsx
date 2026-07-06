import { Fragment, type ReactNode } from 'react'

import Image from 'next/image'
import Link from 'next/link'

import { SectionHeadingReveal } from '@/components/motion/section-heading-reveal'
import { StackCard } from '@/components/motion/stack-card'
import { DragScroll } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { HOME_USE_CASE_CARDS } from '@/lib/homepage-section-data'

import type { HomeUseCasesSection } from '@repo/content/schemas'

const LAMBDA_TAG = /<lambdaPrize>(.*?)<\/lambdaPrize>/

function renderLambdaPrizeText(value: string, href: string): ReactNode {
  const match = value.match(LAMBDA_TAG)
  if (!match) return value
  const [full, inner] = match
  const [before, after] = value.split(full)
  return (
    <Fragment>
      {before}
      <Link
        href={href}
        className="cursor-pointer underline decoration-[1px] underline-offset-[3px] transition-opacity hover:opacity-70"
      >
        {inner}
      </Link>
      {after}
    </Fragment>
  )
}

export default function UseCasesSection({
  data,
}: {
  data: HomeUseCasesSection
}) {
  return (
    <StackCard
      rise={180}
      className="relative z-[4] -mt-[180px] rounded-t-[40px] bg-gray-01 text-brand-dark-green lg:rounded-t-[100px]"
    >
      <div className="mx-auto max-w-[1440px] py-[82px] lg:px-3 lg:pt-[112px] lg:pb-[112px]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center pb-[45px] text-center lg:gap-12 lg:pb-12">
          <div className="flex w-full flex-col items-center px-3 lg:gap-12 lg:px-0">
            <div className="flex max-w-[357px] flex-col items-center gap-8 text-center lg:hidden">
              <p className="text-h4-sans whitespace-pre-line">
                {data.headlineMobile}
              </p>
              <p className="text-mono-s whitespace-pre-line">
                {renderLambdaPrizeText(data.lambdaMobile, ROUTES.lambdaPrize)}
              </p>
            </div>
            <p className="text-mono-s hidden w-full lg:block">{data.eyebrow}</p>
            <SectionHeadingReveal className="text-h3-serif hidden w-full whitespace-normal lg:block desktop:whitespace-pre-line">
              {data.headline}
            </SectionHeadingReveal>
          </div>
          <SectionHeadingReveal className="font-mono-body mt-[80px] text-center text-[10px] leading-[1.3] tracking-normal whitespace-nowrap lg:mt-0 lg:hidden">
            {data.eyebrow}
          </SectionHeadingReveal>
          <p className="text-mono-s hidden w-full lg:block">
            {renderLambdaPrizeText(data.lambda, ROUTES.lambdaPrize)}
          </p>
        </div>

        <DragScroll className="flex w-full cursor-pointer snap-x snap-mandatory scroll-ps-3 gap-3 overflow-x-auto px-3 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:cursor-auto lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
          {HOME_USE_CASE_CARDS.map((card) => (
            <article
              key={card.key}
              className="relative h-[317px] w-[calc(100vw-24px)] max-w-[345px] shrink-0 snap-start overflow-hidden rounded-[12px] border border-brand-dark-green lg:flex lg:h-[317px] lg:w-auto lg:max-w-none lg:flex-col lg:justify-between lg:p-3"
            >
              <h3 className="absolute top-[15px] left-[15px] w-[249px] font-sans text-[24px] leading-[1.1] font-normal tracking-[-0.24px] lg:static lg:max-w-[249px] lg:w-auto">
                {
                  data[
                    card.key as 'secure' | 'money' | 'archives' | 'donations'
                  ].title
                }
              </h3>
              <div className="absolute right-[10px] bottom-[11px] left-[15px] flex items-end justify-between gap-3 lg:static">
                <p className="font-mono-body w-[186px] text-[10px] leading-[1.3] lg:max-w-[186px]">
                  {
                    data[
                      card.key as 'secure' | 'money' | 'archives' | 'donations'
                    ].body
                  }
                </p>
                <div className="relative h-[118px] w-[96px] shrink-0 overflow-hidden">
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              </div>
            </article>
          ))}
        </DragScroll>
      </div>
    </StackCard>
  )
}
