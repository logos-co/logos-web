import type { FeaturedTextSection } from '@repo/content/schemas'

import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui'
import { fetchCircleEvents } from '@/lib/circle-events'

import CirclesMapLoader from './circles-map-loader'

type Props = {
  data: FeaturedTextSection
}

export default async function CirclesCtaSection({ data }: Props) {
  const events = await fetchCircleEvents()

  return (
    <section className="relative h-[1180px] overflow-hidden bg-brand-off-white md:h-[1225px]">
      <Reveal amount={0.2} className="absolute top-[100px] left-0 w-full">
        <h2 className="text-h1 flex flex-col items-center gap-[6px] text-center text-brand-dark-green md:gap-0">
          <span>{data.title.highlight}</span>
          <span className="md:-mt-1">{data.title.rest}</span>
        </h2>
      </Reveal>

      {data.body && data.body.length > 0 ? (
        <Reveal
          amount={0.2}
          className="text-mono-s absolute top-[255px] left-3 flex w-[369px] flex-col gap-3 text-center text-brand-dark-green md:top-[300px] md:left-1/2 md:w-[378px] md:-translate-x-1/2"
        >
          {data.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </Reveal>
      ) : null}

      <Reveal
        amount={0.2}
        className="absolute top-[347px] left-[61px] flex items-baseline gap-3 md:top-[392px] md:left-1/2 md:-translate-x-1/2"
      >
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
      </Reveal>

      <Reveal
        amount={0.1}
        className="bg-gray-01 absolute top-[448px] left-3 h-[720px] w-[369px] overflow-hidden rounded-[100px] md:top-[493px] md:left-1/2 md:h-[720px] md:w-[1416px] md:-translate-x-1/2"
      >
        <div className="h-[710px] w-full">
          <CirclesMapLoader events={events} />
        </div>
      </Reveal>
    </section>
  )
}
