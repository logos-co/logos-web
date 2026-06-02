import type { BuilderHubSettings } from '@repo/content/schemas'

import { Button } from '@/components/ui'

import { externalProps, SectionFrame } from './atoms'
import type { Cta } from './types'

export function BuildSection({
  data,
}: {
  data: NonNullable<BuilderHubSettings['build']>
}) {
  return (
    <SectionFrame id="start-building" index="03" title={data.title}>
      <div className="grid gap-3 md:grid-cols-4">
        {data.cards.map((card) => (
          <div
            key={card.title}
            className="flex h-[300px] min-w-0 flex-col items-center justify-between rounded-xl bg-accent-light-blue px-4 pt-15 pb-3 text-center md:h-[370px]"
          >
            <div className="flex w-full min-w-0 flex-col items-center gap-3">
              <h3 className="text-subhead-sans max-w-full break-words">
                {card.title}
              </h3>
              <p className="w-full max-w-[222px] break-words text-mono-s [overflow-wrap:anywhere]">
                {card.description}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3">
              {card.ctas.map((cta) => (
                <ThinCta key={`${card.title}-${cta.label}`} cta={cta} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  )
}

function ThinCta({ cta }: { cta: Cta }) {
  return (
    <Button
      href={cta.href}
      variant="secondary"
      className="h-[31px] w-full rounded-none py-0"
      {...externalProps(cta)}
    >
      {cta.label}
    </Button>
  )
}
