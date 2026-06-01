import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'
import { Button, ButtonArrowIcon } from '@/components/ui'
import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'

interface SupportCard {
  title: string
  href: string
  cta: string
}

function SupportCardView({ card }: { card: SupportCard }) {
  return (
    <article className="flex h-[106px] flex-col justify-between rounded-xl border border-brand-dark-green/50 p-4 text-brand-dark-green min-[1025px]:h-[132px]">
      <h3 className="font-sans text-[18px] leading-[1.15] tracking-[-0.01em]">
        {card.title}
      </h3>
      <Button
        href={card.href}
        variant="link"
        icon={<ButtonArrowIcon />}
        className="w-fit cursor-pointer transition-opacity hover:opacity-70"
      >
        {card.cta}
      </Button>
    </article>
  )
}

export default async function StartBuildingSection({
  locale,
}: {
  locale: string
}) {
  const t = await getTranslations({ locale, namespace: 'home.startBuilding' })

  const cards: SupportCard[] = [
    { title: t('lambdaPrize'), href: ROUTES.lambdaPrize, cta: t('cardCta') },
    { title: t('rfps'), href: ROUTES.rfps, cta: t('cardCta') },
    { title: t('ideas'), href: ROUTES.ideas, cta: t('cardCta') },
    { title: t('docs'), href: EXTERNAL_URLS.docs, cta: t('cardCta') },
  ]

  return (
    <section className="bg-brand-off-white">
      <ContentWidth className="grid gap-3 pt-[100px] min-[1025px]:grid-cols-2 min-[1025px]:pt-[58px] min-[1025px]:pb-28">
        <div className="relative h-[319px] w-full overflow-hidden rounded-[100px] bg-brand-dark-green/10 min-[1025px]:h-[696px] min-[1025px]:w-auto">
          <Image
            src="/images/home/figma-refresh/start-building.webp"
            alt=""
            fill
            sizes="(max-width: 768px) calc(100vw - 24px), 702px"
            className="object-cover object-center"
          />
        </div>

        <div className="flex min-h-[705px] flex-col justify-between rounded-xl bg-[#dbddd7] p-3 text-brand-dark-green min-[1025px]:min-h-[696px] min-[1025px]:p-6">
          <div className="mx-auto mt-7 flex max-w-[320px] flex-col items-center gap-10 text-center min-[1025px]:mt-[113px]">
            <div className="flex flex-col items-center gap-6 min-[1025px]:w-[320px]">
              <h2 className="font-display text-[30px] leading-none tracking-[-0.03em] min-[1025px]:text-[36px]">
                {t('title')}
              </h2>
              <p className="h-[28px] overflow-hidden font-sans text-[12px] leading-[1.2] min-[1025px]:h-auto min-[1025px]:w-[254px]">
                {t('body')}
              </p>
            </div>
            <Button
              href={ROUTES.buildersHub}
              className="cursor-pointer transition-opacity hover:opacity-80"
            >
              {t('cta')}
            </Button>
          </div>

          <div className="grid gap-3 min-[1025px]:grid-cols-2">
            {cards.map((card) => (
              <SupportCardView key={card.title} card={card} />
            ))}
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}
