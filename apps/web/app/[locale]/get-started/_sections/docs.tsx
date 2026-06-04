import ContentWidth from '@/components/layout/content-width'
import {
  StartBuildingCardGrid,
  type StartBuildingCard,
} from '@/components/sections/shared/start-building-card-grid'
import { EXTERNAL_URLS } from '@/constants/routes'

import { SectionHeading } from './atoms'
import type { GetStartedTranslator } from './types'

const cards = [
  {
    key: 'docs',
    ctas: [{ labelKey: 'viewDocsCta', href: EXTERNAL_URLS.docs }],
  },
  {
    key: 'scaffold',
    ctas: [{ labelKey: 'learnMoreCta', href: EXTERNAL_URLS.scaffold }],
  },
  {
    key: 'sampleApps',
    ctas: [
      { labelKey: 'atomicSwapsCta', href: EXTERNAL_URLS.atomicSwaps },
      { labelKey: 'multisigCta', href: EXTERNAL_URLS.multisig },
    ],
  },
  {
    key: 'workshops',
    ctas: [{ labelKey: 'learnMoreCta', href: EXTERNAL_URLS.workshopsPlaylist }],
  },
] as const

export function Docs({ t }: { t: GetStartedTranslator }) {
  const startBuildingCards: readonly StartBuildingCard[] = cards.map(
    (card) => ({
      title: t(`sections.docs.items.${card.key}.title`),
      description: t(`sections.docs.items.${card.key}.body`),
      ctas: card.ctas.map((cta) => ({
        label: t(`sections.docs.${cta.labelKey}`),
        href: cta.href,
        external: true,
      })),
    })
  )

  return (
    <section className="border-t border-brand-dark-green/10 pt-6 pb-25 md:pt-10">
      <ContentWidth className="flex w-full flex-col gap-10">
        <SectionHeading
          number={t('sections.docs.number')}
          heading={t('sections.docs.heading')}
        />

        <StartBuildingCardGrid cards={startBuildingCards} />
      </ContentWidth>
    </section>
  )
}
