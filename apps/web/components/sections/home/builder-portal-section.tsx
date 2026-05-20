import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

import { Reveal, RevealItem } from '@/components/motion/reveal'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

import { DownloadIcon } from '../shared/builder-cta-card'

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
    <section className="relative h-[1281px] border-t border-brand-dark-green/10 bg-brand-off-white pt-5 pb-24 md:h-[1045px] md:py-0">
      <div className="mx-auto max-w-354 px-[10px] md:absolute md:inset-x-0 md:top-[212px] md:px-0">
        <div className="grid gap-3 md:grid-cols-[464px_minmax(0,940px)]">
          <div className="flex min-h-[531px] flex-col justify-between md:min-h-[532px]">
            <Reveal amount={0.2}>
              <h2 className="text-h1 max-w-[702px] whitespace-pre-line text-brand-dark-green md:text-h2">
                {t('title')}
              </h2>
              <div className="mt-[30px]">
                <Button
                  href={ROUTES.buildersHub}
                  variant="secondary"
                  icon={<DownloadIcon />}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                >
                  {t('cta')}
                </Button>
              </div>
            </Reveal>

            <Reveal
              amount={0.2}
              className="text-mono-s whitespace-pre-line text-brand-dark-green md:w-[345px] md:font-sans md:text-[14px] md:leading-[1.2] md:font-medium"
            >
              {t('description')}
            </Reveal>
          </div>

          <Reveal
            amount={0.2}
            className="relative h-[532px] overflow-hidden rounded-3xl bg-[#1c1c1c]"
          >
            <div className="absolute top-[76px] left-[-84px] h-[379px] w-[836px] overflow-hidden rounded-md md:top-[88px] md:left-[33px] md:h-[356px] md:w-[785px]">
              <Image
                src="/images/home/figma-refresh/basecamp.webp"
                alt=""
                fill
                sizes="(max-width: 768px) 321px, 785px"
                className="object-cover object-center"
              />
            </div>
          </Reveal>
        </div>

        <Reveal stagger amount={0.2} className="mt-3 grid gap-3 md:grid-cols-3">
          <RevealItem>
            <BasecampFeature
              label={t('featureChat')}
              image="/images/home/figma-refresh/basecamp-chat.webp"
              imageClassName="rotate-90 scale-125"
            />
          </RevealItem>
          <RevealItem>
            <BasecampFeature
              label={t('featureNode')}
              image="/images/home/figma-refresh/basecamp-node.webp"
              imageClassName="scale-125"
            />
          </RevealItem>
          <RevealItem>
            <BasecampFeature
              label={t('featureTransactions')}
              image="/images/home/figma-refresh/basecamp-transactions.webp"
              imageClassName="scale-125"
            />
          </RevealItem>
        </Reveal>
      </div>
    </section>
  )
}
