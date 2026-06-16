import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

import { SectionHeadingReveal } from '@/components/motion/section-heading-reveal'
import { StackCard } from '@/components/motion/stack-card'

interface UseCaseCard {
  key: 'secure' | 'money' | 'archives' | 'donations'
  image: string
}

const CARDS: UseCaseCard[] = [
  { key: 'secure', image: '/images/home/use-cases/secure.png' },
  { key: 'money', image: '/images/home/use-cases/money.png' },
  { key: 'archives', image: '/images/home/use-cases/archives.png' },
  { key: 'donations', image: '/images/home/use-cases/archives.png' },
]

export default async function UseCasesSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home.useCases' })

  return (
    <StackCard
      rise={180}
      className="relative z-[4] -mt-[180px] rounded-t-[40px] bg-gray-01 text-brand-dark-green lg:rounded-t-[100px]"
    >
      <div className="mx-auto max-w-[1440px] px-3 py-[72px] lg:pt-[112px] lg:pb-[112px]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-10 pb-12 text-center lg:gap-12 lg:pb-[14px]">
          <div className="flex w-full flex-col items-center gap-8 lg:gap-12">
            <p className="text-mono-s w-full">{t('eyebrow')}</p>
            <SectionHeadingReveal className="text-h3-serif w-full whitespace-normal desktop:whitespace-pre-line">
              {t('headline')}
            </SectionHeadingReveal>
          </div>
          <p className="text-mono-s w-full">{t('lambda')}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card) => (
            <article
              key={card.key}
              className="flex h-[300px] flex-col justify-between rounded-[12px] border border-brand-dark-green p-3 lg:h-[317px]"
            >
              <h3 className="text-h4-sans max-w-[249px]">
                {t(`${card.key}.title`)}
              </h3>
              <div className="flex items-end justify-between gap-3">
                <p className="text-mono-s max-w-[186px]">
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
