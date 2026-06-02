import type { BuilderHubSettings } from '@repo/content/schemas'

import { Button } from '@/components/ui'

import { externalProps, SectionFrame } from './atoms'

export function SupportSection({
  data,
}: {
  data: NonNullable<BuilderHubSettings['support']>
}) {
  return (
    <SectionFrame id="get-support" index="05" title={data.title}>
      <div className="grid gap-3 md:grid-cols-3">
        {data.cards.map((card, index) => (
          <div
            key={card.title}
            className={`flex flex-col items-start justify-between rounded-xl bg-gray-01 p-4 ${
              index === 0 ? 'h-[250px]' : 'h-[171px] md:h-[250px]'
            }`}
          >
            <div className="flex flex-col gap-3">
              <h3 className="text-h4-sans">{card.title}</h3>
              {card.description ? (
                <p className="w-[216px] whitespace-pre-line text-body-sans">
                  {card.description}
                </p>
              ) : null}
            </div>
            {card.metrics ? (
              <div className="flex gap-6">
                {card.metrics.map((metric) => (
                  <div key={metric.label} className="w-[42px]">
                    <p className="text-h4-serif">{metric.value}</p>
                    <p className="mt-1.5 text-eyebrow">{metric.label}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <Button
              href={card.cta.href}
              variant="primary"
              className="h-[31px]"
              {...externalProps(card.cta)}
            >
              {card.cta.label}
            </Button>
          </div>
        ))}
      </div>
    </SectionFrame>
  )
}
