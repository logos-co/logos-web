import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'

import { Cta, LambdaBadge, SectionHeader, movementImages } from './atoms'
import type { Translate } from './types'

export function ActionCardsSection({ t }: { t: Translate }) {
  const cards = [
    {
      key: 'activism',
      image: movementImages.activism,
      href: '#activist-circle',
    },
    {
      key: 'coalition',
      image: movementImages.coalition,
      href: '#join-the-coalition',
    },
    {
      key: 'building',
      image: movementImages.building,
      href: '#activist-builder',
    },
  ]

  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white pt-10 pb-10 md:pt-0 md:pb-17.5">
      <SectionHeader
        title={
          <>
            {t('intro.titleLine1')}
            <br />
            {t('intro.titleLine2')}
          </>
        }
        description={t('intro.body')}
        className="pb-10 md:pt-6 md:pb-15"
        titleClassName="max-w-[244px]"
        descriptionClassName="md:col-span-4"
      />
      <ContentWidth className="grid gap-3 px-3 md:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.key}
            className="flex flex-col gap-3 rounded-3xl bg-gray-01 p-1.5 pb-3 text-brand-dark-green md:min-h-[412px]"
          >
            <div className="relative h-[273px] overflow-hidden rounded-[18px]">
              <Image
                src={card.image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="flex gap-3 px-1.5 pt-1">
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <LambdaBadge size={23} circle />
                  <h3 className="text-subhead-sans">
                    {t(`actions.${card.key}.title`)}
                  </h3>
                </div>
              </div>
              <p className="text-mono-s flex-1">
                {t(`actions.${card.key}.body`)}
              </p>
            </div>
            <Cta
              href={card.href}
              label={t(`actions.${card.key}.cta`)}
              tone="light"
              className="mx-1.5 mt-auto w-[calc(100%-12px)]"
            />
          </article>
        ))}
      </ContentWidth>
    </section>
  )
}
