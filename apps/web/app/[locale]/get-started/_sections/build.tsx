import ContentWidth from '@/components/layout/content-width'
import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'

import { ActionLink, SectionHeading } from './atoms'
import type { BuildItem, GetStartedTranslator } from './types'

const buildItems: readonly BuildItem[] = [
  { key: 'node', ctaKey: 'nodeCta', href: ROUTES.nodeProgramme, hasBody: true },
  {
    key: 'messaging',
    ctaKey: 'messagingCta',
    href: ROUTES.messaging,
    hasBody: true,
  },
  { key: 'lez', ctaKey: 'deployCta', href: ROUTES.blockchain, hasBody: true },
  {
    key: 'storage',
    ctaKey: 'tryItOutCta',
    href: ROUTES.storage,
    hasBody: true,
  },
  { key: 'atomicSwaps', ctaKey: 'cta', href: EXTERNAL_URLS.github },
  { key: 'zkMultiSig', ctaKey: 'cta', href: EXTERNAL_URLS.github },
  { key: 'scaffold', ctaKey: 'scaffoldCta', href: EXTERNAL_URLS.github },
] as const

export function Build({ t }: { t: GetStartedTranslator }) {
  return (
    <section className="border-t border-brand-dark-green/10 pt-6 pb-25">
      <ContentWidth className="flex w-full flex-col gap-10">
        <SectionHeading
          number={t('sections.build.number')}
          heading={t('sections.build.heading')}
        />
        <div className="grid gap-3 md:grid-cols-3">
          {buildItems.map((item) => {
            return (
              <article
                key={item.key}
                className="flex min-h-[200px] flex-col justify-between rounded-xl bg-gray-01 p-4 md:min-h-[250px]"
              >
                <div className="flex flex-col gap-3">
                  <h3 className="font-sans text-[24px] leading-[1.1] tracking-[-0.24px]">
                    {t(`sections.build.items.${item.key}.title`)}
                  </h3>
                  {'hasBody' in item && item.hasBody ? (
                    <p className="max-w-[329px] font-sans text-[14px] leading-[1.2]">
                      {t(`sections.build.items.${item.key}.body`)}
                    </p>
                  ) : null}
                </div>
                <ActionLink
                  href={item.href}
                  variant="primary"
                  className="w-fit self-start"
                >
                  {t(`sections.build.${item.ctaKey}`)}
                </ActionLink>
              </article>
            )
          })}
        </div>
      </ContentWidth>
    </section>
  )
}
