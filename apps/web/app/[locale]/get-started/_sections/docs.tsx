import type { GetStartedCopySection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import {
  StartBuildingCardGrid,
  type StartBuildingCard,
} from '@/components/sections/shared/start-building-card-grid'
import { EXTERNAL_URLS } from '@/constants/routes'

import { SectionHeading } from './atoms'

const cards = [
  {
    key: 'docs' as const,
    ctas: [{ labelKey: 'viewDocsCta' as const, href: EXTERNAL_URLS.docs }],
  },
  {
    key: 'scaffold' as const,
    ctas: [{ labelKey: 'learnMoreCta' as const, href: EXTERNAL_URLS.scaffold }],
  },
  {
    key: 'sampleApps' as const,
    ctas: [
      { labelKey: 'atomicSwapsCta' as const, href: EXTERNAL_URLS.atomicSwaps },
      { labelKey: 'multisigCta' as const, href: EXTERNAL_URLS.multisig },
    ],
  },
  {
    key: 'workshops' as const,
    ctas: [{ labelKey: 'learnMoreCta' as const, href: EXTERNAL_URLS.workshopsPlaylist }],
  },
]

export function Docs({ data }: { data: GetStartedCopySection['sections']['docs'] }) {
  const startBuildingCards: readonly StartBuildingCard[] = cards.map(
    (card) => ({
      title: data.items[card.key].title,
      description: data.items[card.key].body ?? '',
      ctas: card.ctas.map((cta) => ({
        label: data[cta.labelKey],
        href: cta.href,
        external: true,
      })),
    })
  )

  return (
    <section className="border-t border-brand-dark-green/10 pt-6 pb-25 md:pt-10">
      <ContentWidth className="flex w-full flex-col gap-10">
        <SectionHeading
          number={data.number}
          heading={data.heading}
        />

        <StartBuildingCardGrid cards={startBuildingCards} />
      </ContentWidth>
    </section>
  )
}
