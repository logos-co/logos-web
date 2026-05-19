import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

interface SupportCard {
  title: string
  href: string
  cta: string
}

function SupportCardView({ card }: { card: SupportCard }) {
  return (
    <article className="flex h-[106px] flex-col justify-between rounded-xl border border-brand-dark-green/50 p-4 text-brand-dark-green md:h-[132px]">
      <h3 className="font-sans text-[18px] leading-[1.15] tracking-[-0.01em]">
        {card.title}
      </h3>
      <Button
        href={card.href}
        variant="link"
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
    { title: t('docs'), href: ROUTES.technologyStack, cta: t('cardCta') },
  ]

  return (
    <section className="h-[1236px] overflow-hidden bg-brand-off-white py-24 md:h-[820px] md:py-[62px]">
      <div className="mx-auto grid max-w-354 gap-3 px-3 md:grid-cols-2">
        <div className="relative h-[319px] overflow-hidden rounded-[100px] bg-brand-dark-green/10 md:h-[696px]">
          <Image
            src="/images/home/figma-refresh/start-building.webp"
            alt=""
            fill
            sizes="(max-width: 768px) 369px, 702px"
            className="object-cover object-center"
          />
        </div>

        <div className="flex min-h-[705px] flex-col justify-between rounded-xl bg-[#dbddd7] p-6 text-brand-dark-green md:min-h-[696px]">
          <div className="mx-auto mt-8 flex max-w-[320px] flex-col items-center gap-6 text-center md:mt-[113px]">
            <h2 className="font-display text-[30px] leading-none tracking-[-0.03em] md:text-[36px]">
              {t('title')}
            </h2>
            <p className="font-sans text-[14px] leading-[1.2]">
              <span className="md:hidden">{t('mobileBody')}</span>
              <span className="hidden md:inline">{t('body')}</span>
            </p>
            <Button
              href={ROUTES.buildersHub}
              className="cursor-pointer transition-opacity hover:opacity-80"
            >
              {t('cta')}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {cards.map((card) => (
              <SupportCardView key={card.title} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
