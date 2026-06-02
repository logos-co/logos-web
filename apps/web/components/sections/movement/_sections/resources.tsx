import ContentWidth from '@/components/layout/content-width'
import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'

import { Cta, SectionHeader } from './atoms'
import type { Translate } from './types'

export function ResourcesSection({ t }: { t: Translate }) {
  const rows = ['start', 'forum', 'discord']

  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white pb-45 text-brand-dark-green md:pb-28.5">
      <SectionHeader
        title={
          <>
            {t('resources.titleLine1')}
            <br />
            {t('resources.titleLine2')}
          </>
        }
        description={t('resources.body')}
        cta={
          <Cta href={ROUTES.faq} label={t('resources.cta')} tone="tertiary" />
        }
        className="pb-10 md:pb-13.5"
        descriptionClassName="max-w-[178px]"
      />
      <ContentWidth>
        {rows.map((row, index) => (
          <div
            key={row}
            className={`grid min-h-[58px] grid-cols-[1fr_auto] items-start gap-3 px-3 py-3 md:min-h-[50px] md:grid-cols-12 ${
              index % 2 === 0 ? 'bg-gray-01' : 'bg-brand-dark-green/5'
            }`}
          >
            <div className="flex gap-3 text-[14px] leading-[1.2] md:col-span-6">
              <span className="font-sans font-medium">
                {t(`resources.rows.${row}.number`)}
              </span>
              <span className="font-display">
                {t(`resources.rows.${row}.title`)}
              </span>
            </div>
            <p className="text-mono-s hidden md:col-span-3 md:block">
              {t(`resources.rows.${row}.body`)}
            </p>
            <div className="md:col-span-2 md:col-start-11">
              <Cta
                href={
                  row === 'discord'
                    ? EXTERNAL_URLS.discord
                    : row === 'forum'
                      ? EXTERNAL_URLS.forum
                      : ROUTES.circles
                }
                label={t(`resources.rows.${row}.cta`)}
                tone="link"
              />
            </div>
          </div>
        ))}
      </ContentWidth>
    </section>
  )
}
