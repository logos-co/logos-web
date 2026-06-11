import type { BuilderHubHomeRfpResolution, Rfp } from '@repo/content/loaders'
import type { BuilderHubSettings } from '@repo/content/schemas'

import { BuildersHubSectionHeader } from './section-header'
import { RfpCard } from './rfp-card'
import { TerminatorCard } from './terminator-card'

type Props = {
  settings: BuilderHubSettings['rfpsSection']
  resolution: BuilderHubHomeRfpResolution
}

/**
 * RFPs grid section on the Builders Hub home (Figma 40009046:24008 / mobile
 * 40009046:23814). Desktop: 4 × 2 grid of 345 × 317 cards. Mobile: horizontal
 * scrolling carousel of the same cards.
 *
 * The terminator (`see-all-ideas`) replaces the last grid cell when supplied
 * by the loader.
 */
export function BuildersHubRfpsSection({ settings, resolution }: Props) {
  const cards: Array<{ kind: 'rfp'; rfp: Rfp } | { kind: 'terminator' }> = [
    ...resolution.rfps.map((rfp): { kind: 'rfp'; rfp: Rfp } => ({
      kind: 'rfp',
      rfp,
    })),
    ...(resolution.terminator ? [{ kind: 'terminator' as const }] : []),
  ]

  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white">
      <div className="mx-auto max-w-360 px-3 pt-10 pb-10">
        <BuildersHubSectionHeader
          title={settings.title}
          eyebrow={settings.description}
          topRightCta={settings.seeAllCta}
        />

        {/* Card grid — desktop wraps to 4 cols, mobile scrolls horizontally */}
        <div className="mt-[77px] flex gap-3 overflow-x-auto md:grid md:overflow-visible min-[768px]:grid-cols-2 min-[1366px]:grid-cols-4">
          {cards.map((entry, index) =>
            entry.kind === 'rfp' ? (
              <RfpCard key={entry.rfp.slug} rfp={entry.rfp} />
            ) : (
              <TerminatorCard
                key={`terminator-${index}`}
                terminator={resolution.terminator!}
              />
            )
          )}
        </div>
      </div>
    </section>
  )
}
