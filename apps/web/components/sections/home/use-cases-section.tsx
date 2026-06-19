import type { ReactNode } from 'react'

import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'

import { SectionHeadingReveal } from '@/components/motion/section-heading-reveal'
import { StackCard } from '@/components/motion/stack-card'
import { ROUTES } from '@/constants/routes'
import { HOME_USE_CASE_CARDS } from '@/lib/homepage-section-data'

export default async function UseCasesSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home.useCases' })
  const renderLambdaPrizeText = (key: 'lambda' | 'lambdaMobile' = 'lambda') =>
    t.rich(key, {
      lambdaPrize: (chunks: ReactNode) => (
        <Link
          href={ROUTES.lambdaPrize}
          className="cursor-pointer underline decoration-[1px] underline-offset-[3px] transition-opacity hover:opacity-70"
        >
          {chunks}
        </Link>
      ),
    })

  return (
    <StackCard
      rise={180}
      className="relative z-[4] -mt-[180px] rounded-t-[40px] bg-gray-01 text-brand-dark-green lg:rounded-t-[100px]"
    >
      <div className="mx-auto max-w-[1440px] py-[82px] lg:px-3 lg:pt-[112px] lg:pb-[112px]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center pb-[45px] text-center lg:gap-12 lg:pb-12">
          <div className="grid w-full grid-cols-[107px_minmax(0,1fr)] gap-[clamp(20px,8vw,48px)] px-3 lg:flex lg:h-auto lg:flex-col lg:items-center lg:gap-12 lg:px-0">
            <div className="relative h-[130px] w-[107px] overflow-hidden lg:hidden">
              <Image
                src="/images/home/usecase-1.webp"
                alt=""
                fill
                sizes="107px"
                className="object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-[17px] text-left lg:hidden">
              <p className="text-body-sans whitespace-pre-line">
                {t('headlineMobile')}
              </p>
              <p className="text-mono-s whitespace-pre-line">
                {renderLambdaPrizeText('lambdaMobile')}
              </p>
            </div>
            <p className="text-mono-s hidden w-full lg:block">{t('eyebrow')}</p>
            <SectionHeadingReveal className="text-h3-serif hidden w-full whitespace-normal lg:block desktop:whitespace-pre-line">
              {t('headline')}
            </SectionHeadingReveal>
          </div>
          <SectionHeadingReveal className="font-mono-body mt-[80px] text-center text-[10px] leading-[1.3] tracking-normal whitespace-nowrap lg:mt-0 lg:hidden">
            {t('eyebrow')}
          </SectionHeadingReveal>
          <p className="text-mono-s hidden w-full lg:block">
            {renderLambdaPrizeText()}
          </p>
        </div>

        <div className="flex w-full snap-x snap-mandatory scroll-ps-3 gap-3 overflow-x-auto px-3 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
          {HOME_USE_CASE_CARDS.map((card) => (
            <article
              key={card.key}
              className="relative h-[317px] w-[calc(100vw-24px)] max-w-[345px] shrink-0 snap-start overflow-hidden rounded-[12px] border border-brand-dark-green lg:flex lg:h-[317px] lg:w-auto lg:max-w-none lg:flex-col lg:justify-between lg:p-3"
            >
              <h3 className="absolute top-[15px] left-[15px] w-[249px] font-sans text-[24px] leading-[1.1] font-normal tracking-[-0.24px] lg:static lg:max-w-[249px] lg:w-auto">
                {t(`${card.key}.title`)}
              </h3>
              <div className="absolute right-[10px] bottom-[11px] left-[15px] flex items-end justify-between gap-3 lg:static">
                <p className="font-mono-body w-[186px] text-[10px] leading-[1.3] lg:max-w-[186px]">
                  {t(`${card.key}.body`)}
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
        </div>
      </div>
    </StackCard>
  )
}
