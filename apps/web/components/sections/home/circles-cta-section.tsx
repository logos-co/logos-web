import type { FeaturedTextSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
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
    <section className="bg-brand-off-white">
      <ContentWidth className="flex flex-col items-center gap-[40px] pt-[100px] pb-0 min-[1025px]:gap-[45px] min-[1025px]:pt-[100px] min-[1025px]:pb-[100px]">
        <Reveal
          amount={0.4}
          delay={0.18}
          viewportMargin="0px 0px -20% 0px"
          className="w-full"
        >
          <h2 className="text-h2 flex flex-col items-center gap-[6px] text-center text-brand-dark-green min-[1025px]:gap-0">
            <span>{data.title.highlight}</span>
            <span className="min-[1025px]:-mt-1">{data.title.rest}</span>
          </h2>
        </Reveal>

        {data.body && data.body.length > 0 ? (
          <div className="text-mono-s flex w-full max-w-[378px] flex-col gap-3 text-center text-brand-dark-green">
            {data.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        ) : null}

        <div className="flex items-baseline gap-3">
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

        <div className="mt-[30px] h-[720px] w-full overflow-hidden rounded-[100px] bg-gray-01 min-[1025px]:mt-0">
          <div className="h-[710px] w-full">
            <CirclesMapLoader events={events} />
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}
