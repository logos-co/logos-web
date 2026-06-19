import { getTranslations } from 'next-intl/server'

import { StackCard } from '@/components/motion/stack-card'

function DesktopLineBreak() {
  return <br className="hidden min-[1440px]:block" />
}

function TabletLineBreak() {
  return <br className="hidden min-[768px]:block" />
}

export default async function DecideSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home.decide' })

  return (
    <StackCard
      rise={180}
      className="relative z-[3] -mt-[180px] rounded-t-[36px] bg-gray-03 text-brand-dark-green"
    >
      <div className="desktop:flex-row desktop:items-center desktop:justify-between desktop:gap-16 desktop:px-[131px] desktop:pt-[112px] desktop:pb-[224px] mx-auto flex max-w-[1440px] flex-col gap-10 px-3 pt-[88px] pb-[200px]">
        <div className="flex flex-col items-start gap-8 min-[768px]:max-[1439px]:items-center min-[768px]:max-[1439px]:text-center min-[1440px]:max-w-[510px] min-[1440px]:gap-12">
          <h2 className="w-full max-w-[510px] whitespace-pre-wrap font-display text-[40px] leading-none tracking-[-0.03em] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] [word-break:break-word] min-[768px]:max-[1439px]:text-[48px] min-[1440px]:text-[56px]">
            <span className="block">{t('headline')}</span>
            <span aria-hidden="true" className="block h-[1em]" />
            <span>
              {t('headline2')}
              <TabletLineBreak />
              <span className="min-[768px]:hidden"> </span>
              <span className="text-[#F5F5EF]">{t('headline3')}</span>
            </span>
          </h2>
          <p className="w-full max-w-[510px] font-display text-[24px] leading-[1.1] tracking-[-0.24px] [word-break:normal] md:w-[510px]">
            {t('bodyPart1')}
            <DesktopLineBreak />
            <span className="min-[1440px]:hidden"> </span>
            {t('bodyPart2')}
            <DesktopLineBreak />
            <span className="min-[1440px]:hidden"> </span>
            {t('bodyPart3')}
            <DesktopLineBreak />
            <span className="min-[1440px]:hidden"> </span>
            {t('bodyPart4')}
          </p>
        </div>

        <div className="desktop:aspect-auto desktop:h-[695px] desktop:w-[583px] desktop:rounded-[50px] relative aspect-[583/520] w-full shrink-0 overflow-hidden rounded-[40px] min-[450px]:max-[599.98px]:aspect-[583/304] min-[600px]:max-[767.98px]:aspect-[583/260] min-[768px]:max-desktop:aspect-[583/231]">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/images/home/figma-refresh/path-activism.webp"
            className="desktop:rounded-[50px] absolute inset-0 h-full w-full rounded-[40px] object-cover"
          >
            <source src="/videos/home/mountain.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </StackCard>
  )
}
