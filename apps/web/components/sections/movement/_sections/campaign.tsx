import Image from 'next/image'
import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'

import { Cta, movementImages } from './atoms'
import type { Translate } from './types'

export function CampaignSection({ t }: { t: Translate }) {
  return (
    <section className="bg-brand-off-white px-3 py-10 md:py-0">
      <ContentWidth className="grid overflow-hidden rounded-xl bg-gray-01 p-3 text-brand-dark-green md:grid-cols-2 md:gap-3">
        <div className="flex min-h-[462px] flex-col justify-between p-3 md:min-h-[462px]">
          <div className="flex gap-22">
            <LogosMark size={7} />
            <p className="text-eyebrow w-[185px]">{t('campaign.eyebrow')}</p>
          </div>
          <div className="mx-auto flex max-w-[678px] flex-col items-center gap-10 text-center">
            <div className="flex max-w-[320px] flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-3">
                <p className="text-eyebrow">{t('campaign.kicker')}</p>
                <h2 className="text-h3-sans">{t('campaign.title')}</h2>
              </div>
              <p className="text-caption-sans font-medium">
                {t('campaign.body')}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              <Cta href={ROUTES.circles} label={t('campaign.primaryCta')} />
              <Cta
                href={EXTERNAL_URLS.forumMeetups}
                label={t('campaign.secondaryCta')}
                tone="secondary"
              />
              <Cta
                href={EXTERNAL_URLS.discord}
                label={t('campaign.tertiaryCta')}
                tone="tertiary"
              />
            </div>
          </div>
          <div aria-hidden="true" className="opacity-0">
            <LogosMark size={7} />
          </div>
        </div>
        <div className="relative min-h-[270px] overflow-hidden rounded-[40px] md:min-h-[462px]">
          <Image
            src={movementImages.campaign}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </ContentWidth>
    </section>
  )
}
