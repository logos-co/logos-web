import { Button } from '@/components/ui'

export interface StartBuildingCardCta {
  label: string
  href: string
  external?: boolean
}

export interface StartBuildingCard {
  title: string
  description: string
  ctas: readonly StartBuildingCardCta[]
}

interface StartBuildingCardGridProps {
  cards: readonly StartBuildingCard[]
}

function externalProps(cta: StartBuildingCardCta) {
  return cta.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

export function StartBuildingCardGrid({ cards }: StartBuildingCardGridProps) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.title}
          className="flex h-[300px] min-w-0 flex-col items-center justify-between overflow-hidden rounded-xl bg-accent-light-blue px-4 pt-15 pb-3 text-center md:h-[370px]"
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
              <Button
                key={`${card.title}-${cta.label}`}
                href={cta.href}
                variant="secondary"
                className="h-[31px] w-full cursor-pointer rounded-none py-0"
                {...externalProps(cta)}
              >
                {cta.label}
              </Button>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}
