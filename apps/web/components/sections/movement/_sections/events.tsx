import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'
import { ROUTES } from '@/constants/routes'

import { Cta, SectionHeader, movementImages } from './atoms'
import type { Translate } from './types'

function EventCard({ t }: { t: Translate }) {
  return (
    <article className="flex w-full shrink-0 items-center gap-3 rounded-3xl bg-gray-01 py-1.5 pr-3 pl-1.5 text-brand-dark-green md:w-[463px] md:pr-6">
      <div className="relative size-[123px] shrink-0 overflow-hidden rounded-[18px]">
        <Image
          src={movementImages.event}
          alt=""
          fill
          sizes="123px"
          className="object-cover"
        />
      </div>
      <div className="flex h-[123px] min-w-0 flex-col justify-between py-1">
        <h3 className="text-subhead-sans max-w-[193px] md:max-w-none md:whitespace-nowrap">
          {t('events.card.title')}
        </h3>
        <div className="flex flex-col gap-0.5">
          <p className="text-mono-s text-gray-05">
            {t('events.card.time')}{' '}
            <span className="text-brand-dark-green">
              {t('events.card.timezone')}
            </span>
          </p>
          <p className="text-mono-s text-gray-05">
            {t('events.card.location')}
          </p>
          <p className="text-mono-s max-w-[185px] text-gray-05">
            {t('events.card.hosts')}
          </p>
        </div>
      </div>
    </article>
  )
}

export function EventsSection({ t }: { t: Translate }) {
  const rows = [
    { key: 'day1', cards: 2 },
    { key: 'day2', cards: 1 },
    { key: 'day3', cards: 2 },
  ]

  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white pb-10 text-brand-dark-green md:pb-25">
      <SectionHeader
        title={t('events.title')}
        description={t('events.body')}
        cta={
          <Cta href={ROUTES.circles} label={t('events.cta')} tone="tertiary" />
        }
        className="pb-10 md:pb-[73px]"
        descriptionClassName="max-w-[178px]"
      />
      <ContentWidth className="flex flex-col gap-10">
        {rows.map((row) => (
          <div key={row.key} className="flex flex-col gap-3">
            <div className="flex gap-1.5 px-3 text-eyebrow">
              <p className="w-[70px]">{t(`events.${row.key}.date`)}</p>
              <p className="text-brand-dark-green/50">
                {t(`events.${row.key}.weekday`)}
              </p>
            </div>
            <div className="mx-3 h-px bg-brand-dark-green/10" />
            <div className="flex flex-col gap-3 overflow-hidden px-3 md:flex-row">
              {Array.from({ length: row.cards }).map((_, index) => (
                <EventCard key={`${row.key}-${index}`} t={t} />
              ))}
            </div>
          </div>
        ))}
      </ContentWidth>
    </section>
  )
}
