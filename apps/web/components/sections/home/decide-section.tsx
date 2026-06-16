import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

import { StackCard } from '@/components/motion/stack-card'

export default async function DecideSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home.decide' })

  return (
    <StackCard
      className="relative z-[3] -mt-[112px] rounded-t-[36px] bg-gray-03 text-brand-dark-green"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-6 pt-[88px] pb-[200px] lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-[131px] lg:pt-[112px] lg:pb-[224px]">
        <div className="flex flex-col gap-8 lg:max-w-[510px] lg:gap-12">
          <h2 className="text-h2">
            {t('headline')}
            <span className="mt-[1em] block">{t('headline2')}</span>
          </h2>
          <p className="text-h4-serif max-w-[510px]">{t('body')}</p>
        </div>

        <div className="relative aspect-[583/520] w-full shrink-0 overflow-hidden rounded-[40px] lg:aspect-auto lg:h-[695px] lg:w-[583px] lg:rounded-[50px]">
          <Image
            src="/images/home/figma-refresh/path-activism.webp"
            alt=""
            fill
            sizes="(max-width: 1023px) calc(100vw - 48px), 583px"
            className="object-cover"
          />
        </div>
      </div>
    </StackCard>
  )
}
