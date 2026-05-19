import type { FeaturedTextSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'
import { fetchCircleEvents } from '@/lib/circle-events'

import CirclesMapLoader from './circles-map-loader'

type Props = {
  data: FeaturedTextSection
}

export default async function CirclesCtaSection({ data }: Props) {
  const events = await fetchCircleEvents()

  return (
    <section className="h-[1180px] overflow-hidden bg-brand-off-white py-24 md:h-[1225px] md:py-[100px]">
      <div className="mx-auto max-w-354 px-3">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-h2 max-w-[940px] text-brand-dark-green">
            <span>{data.title.highlight}</span> {data.title.rest}
          </h2>

          {data.body && data.body.length > 0 ? (
            <div className="text-mono-s text-brand-dark-green/70 mt-10 max-w-114 flex flex-col gap-3">
              {data.body.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          <div className="mt-8 flex items-center gap-3">
            {data.cta ? (
              <Button
                href={data.cta.href}
                className="cursor-pointer transition-opacity hover:opacity-70"
              >
                {data.cta.label}
              </Button>
            ) : null}
            {data.secondaryCta ? (
              <Button
                href={data.secondaryCta.href}
                variant="link"
                className="cursor-pointer transition-opacity hover:opacity-70"
              >
                {data.secondaryCta.label}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="bg-gray-01 mt-16 aspect-[369/710] overflow-hidden rounded-xl md:aspect-1416/710">
          <CirclesMapLoader events={events} />
        </div>
      </div>
    </section>
  )
}
