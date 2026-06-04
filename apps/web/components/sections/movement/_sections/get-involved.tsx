import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'
import { EXTERNAL_URLS } from '@/constants/routes'

import { Cta, movementImages } from './atoms'
import type { Translate } from './types'

export function GetInvolvedSection({ t }: { t: Translate }) {
  return (
    <section className="bg-brand-off-white px-3 py-10 text-brand-dark-green">
      <ContentWidth className="grid gap-3 md:grid-cols-2">
      <div className="flex h-[270px] flex-col items-center justify-center gap-8 border border-brand-dark-green p-4 text-center md:h-[500px] md:gap-10">
        <div className="flex max-w-[337px] flex-col items-center gap-3 md:max-w-[380px]">
          <h2 className="text-subhead-sans">{t('involved.title')}</h2>
          <p className="text-mono-s">{t('involved.body')}</p>
        </div>
        <div className="flex flex-col items-center gap-1 md:flex-row">
          <Cta href={EXTERNAL_URLS.twitter} label={t('involved.primaryCta')} />
          <Cta
            href={EXTERNAL_URLS.discord}
            label={t('involved.secondaryCta')}
            tone="secondary"
          />
        </div>
      </div>
      <div id="join-the-coalition" className="relative flex h-[270px] items-center justify-center overflow-hidden rounded-[160px] text-center text-brand-off-white md:h-[500px] md:rounded-[200px]">
        <Image
          src={movementImages.coalitionBg}
          alt=""
          fill
          sizes="50vw"
          className="scale-125 object-cover blur-[30px]"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative flex max-w-[432px] flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-3">
            <h2 className="text-subhead-sans">{t('coalition.title')}</h2>
            <p className="text-mono-s max-w-[236px] md:max-w-[380px]">
              {t('coalition.body')}
            </p>
          </div>
          <Cta
            href={EXTERNAL_URLS.forum}
            label={t('coalition.cta')}
            tone="light"
          />
        </div>
      </div>
      </ContentWidth>
    </section>
  )
}
