import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

interface BasecampFeatureProps {
  label: string
  image: string
  imageClassName?: string
}

function BasecampFeature({
  label,
  image,
  imageClassName,
}: BasecampFeatureProps) {
  return (
    <div className="relative flex h-[55px] items-center justify-center overflow-hidden rounded-xl border border-brand-dark-green/50 font-sans text-[18px] leading-[1.15] tracking-[-0.01em] text-brand-dark-green md:h-[189px]">
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 768px) 369px, 464px"
        className={`object-cover blur-[20px] md:hidden ${imageClassName ?? ''}`}
      />
      <div className="absolute inset-0 bg-black/20 md:hidden" />
      <span className="relative z-[1] text-brand-off-white md:text-brand-dark-green">
        {label}
      </span>
    </div>
  )
}

export default async function BuilderPortalSection({
  locale,
}: {
  locale: string
}) {
  const t = await getTranslations({ locale, namespace: 'home.builderPortal' })

  return (
    <section className="h-[1281px] border-t border-brand-dark-green/10 bg-brand-off-white py-24 md:h-auto md:py-[155.5px]">
      <div className="mx-auto max-w-354 px-3">
        <div className="grid gap-3 md:grid-cols-[464px_minmax(0,940px)]">
          <div className="flex min-h-[324px] flex-col justify-between md:min-h-[532px]">
            <div>
              <h2 className="text-h2 max-w-[702px] text-brand-dark-green">
                {t('title')}
              </h2>
              <div className="mt-[30px]">
                <Button
                  href={ROUTES.buildersHub}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                >
                  {t('cta')}
                </Button>
              </div>
            </div>

            <p className="font-sans text-[14px] leading-[1.2] font-medium text-brand-dark-green md:w-[345px]">
              {t('description')}
            </p>
          </div>

          <div className="relative h-[532px] overflow-hidden rounded-3xl bg-[#1c1c1c]">
            <div className="absolute top-[76px] left-[-84px] h-[379px] w-[836px] overflow-hidden rounded-md md:top-[88px] md:left-[33px] md:h-[356px] md:w-[785px]">
              <Image
                src="/images/home/figma-refresh/basecamp.webp"
                alt=""
                fill
                sizes="(max-width: 768px) 321px, 785px"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
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
      </div>
    </section>
  )
}
