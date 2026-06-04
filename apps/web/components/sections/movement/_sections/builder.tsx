import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'
import { ROUTES } from '@/constants/routes'

import {
  CenterCtaSection,
  Cta,
  LambdaBadge,
  movementImages,
} from './atoms'
import type { Translate } from './types'

export function BuilderSection({ t }: { t: Translate }) {
  const details = ['problem', 'solution', 'stack']

  return (
    <section id="activist-builder" className="bg-brand-off-white pt-0 pb-10 text-brand-dark-green md:pb-25">
      <CenterCtaSection
        title={t('builder.title')}
        body={t('builder.body')}
        cta={
          <div className="flex flex-wrap justify-center gap-1">
            <Cta href={ROUTES.buildersHub} label={t('builder.primaryCta')} />
            <Cta
              href={ROUTES.technologyStack}
              label={t('builder.secondaryCta')}
              tone="secondary"
            />
          </div>
        }
        className="md:py-25"
      />
      <ContentWidth className="px-3">
        <article className="relative min-h-[506px] overflow-hidden rounded-xl text-brand-off-white md:min-h-[282px]">
          <Image
            src={movementImages.issueLosAngeles}
            alt=""
            fill
            sizes="100vw"
            className="scale-125 object-cover blur-[20px]"
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative grid min-h-[506px] gap-8 p-3 md:min-h-[282px] md:grid-cols-2">
            <div className="flex min-h-[157px] flex-col justify-between md:min-h-[252px]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <LambdaBadge size={15} tone="light" />
                  <p className="text-subhead-serif">
                    {t('builder.feature.city')}
                  </p>
                </div>
                <Cta
                  href={ROUTES.buildersHub}
                  label={t('builder.feature.cta')}
                  tone="light"
                  className="md:hidden"
                />
              </div>
              <h3 className="text-subhead-sans mx-auto max-w-[220px] text-center md:mx-0 md:text-left">
                {t('builder.feature.title')}
              </h3>
              <Cta
                href={ROUTES.buildersHub}
                label={t('builder.feature.cta')}
                tone="light"
                className="hidden w-fit md:inline-flex"
              />
            </div>
            <div className="flex flex-col justify-end gap-3">
              {details.map((detail) => (
                <div
                  key={detail}
                  className="grid gap-3 border-t border-brand-off-white/50 pt-1.5 md:grid-cols-2"
                >
                  <p className="text-eyebrow">
                    {t(`builder.details.${detail}.label`)}
                  </p>
                  <p className="text-mono-s">
                    {t(`builder.details.${detail}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </ContentWidth>
    </section>
  )
}
