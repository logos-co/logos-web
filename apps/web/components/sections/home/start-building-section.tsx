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
    <article className="flex h-[106px] flex-col justify-between rounded-xl border border-brand-dark-green/50 p-4 text-brand-dark-green lg:h-[132px]">
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
    {
      title: t('ideas'),
      href: EXTERNAL_URLS.communityIdeas,
      cta: t('cardCta'),
    },
    { title: t('docs'), href: EXTERNAL_URLS.docs, cta: t('cardCta') },
  ]

  return (
    <section className="bg-brand-off-white lg:mt-[112px]">
      <ContentWidth className="grid gap-3 lg:grid-cols-2 lg:py-3">
        <div className="relative h-[319px] w-full overflow-hidden rounded-[100px] bg-brand-dark-green/10 lg:h-[724px] lg:w-auto">
          <Image
            src="/images/home/figma-refresh/start-building.webp"
            alt=""
            fill
            sizes="(max-width: 768px) calc(100vw - 24px), 702px"
            className="object-cover object-center min-[360px]:max-lg:object-[center_36%]"
          />
        </div>

        <div className="flex min-h-[705px] flex-col justify-between rounded-xl bg-[#dbddd7] p-3 text-brand-dark-green lg:min-h-[724px] lg:p-6">
          <div className="mx-auto mt-7 flex max-w-[320px] flex-col items-center gap-10 text-center lg:mt-[113px]">
            <div className="flex flex-col items-center gap-6 lg:w-[320px]">
              <h2 className="font-display text-[30px] leading-none tracking-[-0.03em] lg:text-[36px]">
                {t('title')}
              </h2>
              <p className="font-sans text-[12px] leading-[1.2] lg:w-[254px]">
                {t('body')}
              </p>
            </div>
            <Button
              href={ROUTES.getStarted}
              className="cursor-pointer transition-opacity hover:opacity-80"
            >
              {t('cta')}
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {cards.map((card) => (
              <SupportCardView key={card.title} card={card} />
            ))}
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}
