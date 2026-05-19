import { getTranslations } from 'next-intl/server'

import { LogosMark } from '@acid-info/logos-ui'

import { Button } from '@/components/ui'
import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/constants/routes'

import { DownloadIcon } from './builder-cta-card'

type StackCardProps = {
  title: string
  body?: string
  href: string
  wide?: boolean
  zones?: string[]
}

function StackCard({ title, body, href, wide, zones }: StackCardProps) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-brand-dark-green text-center text-brand-dark-green transition-opacity hover:opacity-70 ${
        wide ? 'h-49 w-full' : 'h-64.5 w-full md:h-91.5'
      }`}
    >
      <span className="text-subhead-sans hidden items-center gap-2 md:flex">
        {!wide && <LogosMark size={14} className="shrink-0 text-gray-03" />}
        {title}
      </span>

      <span className="flex w-full flex-col items-center gap-3 px-3 md:hidden">
        <span className="text-subhead-sans w-full max-w-full text-center">
          {title}
        </span>
        {body ? (
          <span className="text-mono-s w-full max-w-full text-center break-words">
            {body}
          </span>
        ) : null}
        {zones ? (
          <span className="flex w-full flex-col gap-1.5 px-0.5">
            {zones.map((zone) => (
              <span
                key={zone}
                className="flex h-12.5 items-center justify-center rounded-[18px] border border-brand-dark-green/50 px-3 text-center font-mono text-[9px] leading-[1.15] font-medium break-words uppercase"
              >
                {zone}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </Link>
  )
}

export default async function TechStackExplorer({
  locale,
}: {
  locale: string
}) {
  const t = await getTranslations({
    locale,
    namespace: 'pages.technologyStack.stack',
  })
  const detailsT = await getTranslations({
    locale,
    namespace: 'pages.storage.techStack',
  })

  return (
    <section className="border-brand-dark-green/10 bg-brand-off-white border-t">
      <div className="mx-auto max-w-360 px-3 pt-25 pb-10">
        <div className="flex flex-col gap-3 text-brand-dark-green md:flex-row md:gap-0">
          <h2 className="text-h4-sans md:w-178.5">
            {t('titleLine1')}
            <br />
            {t('titleLine2')}
          </h2>
          <p className="text-mono-s md:w-83.5">{t('body')}</p>
        </div>

        <div className="mt-15 flex flex-col gap-3 md:mt-25">
          <div className="flex h-27.75 items-start justify-between rounded-xl border border-brand-dark-green px-3 py-3 text-brand-dark-green md:h-49 md:items-center md:justify-center">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
              <span className="text-subhead-sans flex items-center gap-2">
                <LogosMark size={14} className="shrink-0 text-gray-03" />
                {t('basecamp')}
              </span>
              <span className="text-mono-s max-w-52 md:hidden">
                {t('basecampBody')}
              </span>
            </div>
            <Button
              href={ROUTES.technologyStack}
              variant="primary"
              icon={<DownloadIcon />}
              className="cursor-pointer md:hidden"
            >
              {t('basecampCta')}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StackCard
              title={t('storage')}
              body={detailsT('storageBody')}
              href={ROUTES.storage}
            />
            <StackCard
              title={t('messaging')}
              body={detailsT('messagingBody')}
              href={ROUTES.messaging}
            />
            <StackCard
              title={t('blockchain')}
              body={detailsT('blockchainBody')}
              href={ROUTES.blockchain}
              zones={[detailsT('lez'), detailsT('cryptarchia')]}
            />
            <StackCard
              title={t('userModules')}
              body={detailsT('userModulesBody')}
              href={ROUTES.technologyStack}
            />
          </div>

          <StackCard
            title={`${t('networkingLine1')} ${t('networkingLine2')}`}
            body={detailsT('networkingBody')}
            href={ROUTES.networking}
            wide
          />
          <StackCard
            title={t('foundation')}
            body={detailsT('foundationBody')}
            href={ROUTES.technologyStack}
            wide
          />
        </div>
      </div>
    </section>
  )
}
