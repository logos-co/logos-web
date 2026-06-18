import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'
import { SectionHeadingReveal } from '@/components/motion/section-heading-reveal'
import { Button, ButtonArrowIcon } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

// Temporarily hidden — Basecamp feature boxes (chat / node / transactions).
// Keep this so we can re-enable the feature row below later.
// interface BasecampFeatureProps {
//   label: string
//   image: string
//   imageClassName?: string
// }
//
// function BasecampFeature({
//   label,
//   image,
//   imageClassName,
// }: BasecampFeatureProps) {
//   return (
//     <div className="relative flex h-[55px] items-center justify-center overflow-hidden rounded-xl border border-brand-dark-green/50 font-sans text-[18px] leading-[1.15] tracking-[-0.01em] text-brand-dark-green lg:h-[189px]">
//       <Image
//         src={image}
//         alt=""
//         fill
//         sizes="(max-width: 768px) 369px, 464px"
//         className={`object-cover blur-[20px] lg:hidden ${imageClassName ?? ''}`}
//       />
//       <div className="absolute inset-0 bg-black/20 lg:hidden" />
//       <span className="relative z-[1] text-brand-off-white lg:text-brand-dark-green">
//         {label}
//       </span>
//     </div>
//   )
// }

export default async function BuilderPortalSection({
  locale,
}: {
  locale: string
}) {
  const t = await getTranslations({ locale, namespace: 'home.builderPortal' })

  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white">
      <ContentWidth className="desktop:pt-28 py-25 lg:pb-0">
        <div className="desktop:grid-cols-3 desktop:gap-3 grid gap-9">
          <div className="desktop:min-h-[532px] desktop:justify-between desktop:gap-0 flex flex-col gap-10">
            <div className="flex flex-col gap-7.5">
              <SectionHeadingReveal
                className="text-h2 desktop:w-[702px] relative z-[1] max-w-[702px] whitespace-pre-line text-brand-dark-green"
                delay={0.08}
              >
                {t('title')}
              </SectionHeadingReveal>
              <Button
                href={ROUTES.basecamp}
                variant="secondary"
                icon={<ButtonArrowIcon />}
                className="w-fit cursor-pointer transition-opacity hover:opacity-80"
              >
                {t('cta')}
              </Button>
            </div>

            <p className="text-mono-s desktop:w-[345px] whitespace-pre-line text-brand-dark-green">
              {t('description')}
            </p>
          </div>

          <div className="desktop:col-span-2 desktop:aspect-auto desktop:h-[532px] relative aspect-[2820/1596] overflow-hidden rounded-3xl bg-[#1c1c1c] min-[768px]:max-desktop:aspect-[2820/1064]">
            <Image
              src="/images/home/figma-refresh/basecamp.webp"
              alt=""
              fill
              sizes="(max-width: 1024px) calc(100vw - 24px), (max-width: 1440px) calc(66.67vw - 20px), 940px"
              className="object-cover object-top"
            />
          </div>
        </div>

        {/* Temporarily hidden — re-enable to show the Basecamp feature boxes.
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <BasecampFeature
            label={t('featureChat')}
            image="/images/home/figma-refresh/basecamp-chat.webp"
            imageClassName="rotate-90 scale-125"
          />
          <BasecampFeature
            label={t('featureNode')}
            image="/images/home/figma-refresh/basecamp-node.webp"
            imageClassName="scale-125"
          />
          <BasecampFeature
            label={t('featureTransactions')}
            image="/images/home/figma-refresh/basecamp-transactions.webp"
            imageClassName="scale-125"
          />
        </div>
        */}
      </ContentWidth>
    </section>
  )
}
