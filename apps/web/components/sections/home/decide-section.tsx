import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

import { StackCard } from '@/components/motion/stack-card'

export default async function DecideSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home.decide' })

  return (
    <StackCard
      rise={180}
      className="relative z-[3] -mt-[180px] rounded-t-[36px] bg-gray-03 text-brand-dark-green"
    >
      <div className="desktop:flex-row desktop:items-center desktop:justify-between desktop:gap-16 desktop:px-[131px] desktop:pt-[112px] desktop:pb-[224px] mx-auto flex max-w-[1440px] flex-col gap-10 px-6 pt-[88px] pb-[200px]">
        <div className="desktop:max-w-[510px] desktop:gap-12 flex flex-col gap-8">
          <h2 className="text-h2">
            {t('headline')}
            <span className="mt-[1em] block">{t('headline2')}</span>
          </h2>
          <p className="text-h4-serif max-w-[510px]">{t('body')}</p>
        </div>

        <div className="desktop:aspect-auto desktop:h-[695px] desktop:w-[583px] desktop:rounded-[50px] relative aspect-[583/520] w-full shrink-0 overflow-hidden rounded-[40px]">
          <Image
            src="/images/home/figma-refresh/path-activism.webp"
            alt=""
            fill
            sizes="(max-width: 1439px) calc(100vw - 48px), 583px"
            className="object-cover"
          />
        </div>
      </div>
    </StackCard>
  )
}
