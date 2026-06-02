import ContentWidth from '@/components/layout/content-width'
import { EXTERNAL_URLS } from '@/constants/routes'

import { ActionLink, SectionHeading } from './atoms'
import type { DocItem, GetStartedTranslator } from './types'

const docs: readonly DocItem[] = [
  { key: 'architecture', href: EXTERNAL_URLS.docs },
  { key: 'blockchain', href: EXTERNAL_URLS.docs },
  { key: 'messaging', href: EXTERNAL_URLS.docs },
  { key: 'storage', href: EXTERNAL_URLS.docs },
  { key: 'api', href: EXTERNAL_URLS.docs },
] as const

export function Docs({ t }: { t: GetStartedTranslator }) {
  return (
    <section className="border-t border-brand-dark-green/10 pt-6 pb-25 md:pt-10">
      <ContentWidth className="flex w-full flex-col gap-10">
        <div className="grid gap-6 md:grid-cols-12 md:items-start">
          <div className="md:col-span-5">
            <SectionHeading
              number={t('sections.docs.number')}
              heading={t('sections.docs.heading')}
            />
          </div>
          <p className="font-mono text-[10px] leading-[1.3] md:col-span-3">
            {t('sections.docs.body')}
          </p>
          <div className="md:col-span-4 md:flex md:justify-end">
            <ActionLink href={EXTERNAL_URLS.docs}>
              {t('sections.docs.cta')}
            </ActionLink>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {docs.map((doc) => (
            <article
              key={doc.key}
              className="flex min-h-[200px] flex-col items-center justify-between rounded-xl bg-accent-light-blue px-4 pt-15 pb-3 text-center md:min-h-[237px]"
            >
              <div className="flex flex-col items-center gap-3">
                <h3 className="font-sans text-[18px] leading-[1.15] tracking-[-0.18px]">
                  {t(`sections.docs.items.${doc.key}.title`)}
                </h3>
                <p className="max-w-[222px] font-mono text-[10px] leading-[1.3]">
                  {t(`sections.docs.items.${doc.key}.body`)}
                </p>
              </div>
              <ActionLink href={doc.href} className="w-full">
                {t('sections.docs.cardCta')}
              </ActionLink>
            </article>
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
