import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'
import { ROUTES } from '@/constants/routes'

import { Cta, LambdaBadge, SectionHeader, movementImages } from './atoms'
import type { Translate } from './types'

function IssueCard({
  image,
  city,
  title,
  body,
}: {
  image: string
  city: string
  title: string
  body: string
}) {
  return (
    <article className="relative h-[282px] w-full shrink-0 overflow-hidden rounded-xl text-brand-off-white md:w-[440px]">
      <Image
        src={image}
        alt=""
        fill
        sizes="440px"
        className="scale-125 object-cover blur-[20px]"
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-3 flex flex-col justify-between">
        <div className="flex items-center gap-1.5">
          <LambdaBadge size={15} tone="light" />
          <p className="text-subhead-serif">{city}</p>
        </div>
        <h3 className="text-subhead-sans mx-auto max-w-[220px] text-center">
          {title}
        </h3>
        <p className="text-mono-s w-[220px]">{body}</p>
      </div>
    </article>
  )
}

export function ActivismSection({ t }: { t: Translate }) {
  const issues = [
    {
      image: movementImages.issueLosAngeles,
      city: t('activism.cards.losAngeles.city'),
      title: t('activism.cards.losAngeles.title'),
    },
    {
      image: movementImages.issueLondon,
      city: t('activism.cards.london.city'),
      title: t('activism.cards.london.title'),
    },
    {
      image: movementImages.issuePorto,
      city: t('activism.cards.porto.city'),
      title: t('activism.cards.porto.title'),
    },
    {
      image: movementImages.issueLosAngeles,
      city: t('activism.cards.losAngeles.city'),
      title: t('activism.cards.losAngeles.title'),
    },
  ]

  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white pb-10 text-brand-dark-green md:pb-25">
      <SectionHeader
        title={
          <>
            <span className="md:hidden">{t('activism.mobileTitle')}</span>
            <span className="hidden md:inline">{t('activism.title')}</span>
          </>
        }
        description={t('activism.body')}
        cta={<Cta href={ROUTES.circles} label={t('activism.cta')} />}
        className="pb-10 md:pb-19.5"
      />
      <ContentWidth className="overflow-hidden">
        <div className="grid gap-3 px-3 md:flex md:w-max">
          {issues.map((issue, index) => (
            <IssueCard
              key={`${issue.city}-${index}`}
              image={issue.image}
              city={issue.city}
              title={issue.title}
              body={t('activism.cardBody')}
            />
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
