import { getLocale } from 'next-intl/server'
import type { FeaturedTextSection } from '@repo/content/schemas'

import { CirclesWorldMap } from '@/components/circles-map'
import ContentWidth from '@/components/layout/content-width'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui'
import {
  getActiveCircleMarkers,
  getUpcomingCircleEvents,
} from '@/lib/active-circles'

type Props = {
  data: FeaturedTextSection
}

export default async function CirclesCtaSection({ data }: Props) {
  // Same data the Movement map uses, so marker popups behave identically here.
  const [markers, upcomingEvents, locale] = await Promise.all([
    getActiveCircleMarkers(),
    getUpcomingCircleEvents(Infinity),
    getLocale(),
  ])

  return (
    <section className="bg-brand-off-white">
      <ContentWidth className="flex flex-col items-center gap-10 pt-25 pb-3 lg:gap-[45px] lg:pt-25 lg:pb-25">
        <Reveal
          amount={0.4}
          delay={0.18}
          viewportMargin="0px 0px -20% 0px"
          className="w-full"
        >
          <h2 className="text-h2 flex flex-col items-center gap-1.5 text-center text-brand-dark-green lg:gap-0">
            <span>{data.title.highlight}</span>
            <span className="lg:-mt-1">{data.title.rest}</span>
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
              {...(data.secondaryCta.href.startsWith('http')
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              className="cursor-pointer transition-opacity hover:opacity-70"
            >
              {data.secondaryCta.label}
            </Button>
          ) : null}
        </div>

        <div className="relative z-0 isolate mt-7.5 h-[720px] w-full overflow-hidden rounded-[100px] bg-gray-01 lg:mt-0">
          <div className="h-[710px] w-full">
            <CirclesWorldMap
              markers={markers}
              upcomingEvents={upcomingEvents}
              locale={locale}
            />
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}
