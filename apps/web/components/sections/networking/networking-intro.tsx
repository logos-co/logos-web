import type { CtaPanelSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui'

type Props = {
  data: CtaPanelSection
}

export default function NetworkingIntro({ data }: Props) {
  return (
    <section className="h-[235px] border-t border-brand-dark-green/10 bg-brand-off-white md:h-[158px]">
      <ContentWidth className="relative h-full text-brand-dark-green px-0">
        <Reveal className="absolute top-10 left-3">
          <h2 className="text-h4-sans">{data.title}</h2>
        </Reveal>

        {data.description ? (
          <Reveal className="absolute top-[78px] left-3 w-[calc(100%-48px)] md:top-10 md:left-181.5 md:w-86.25">
            <p className="text-mono-s">{data.description}</p>
          </Reveal>
        ) : null}

        {data.cta ? (
          <div className="absolute top-[180px] left-3 md:top-10 md:left-[1202px]">
            <Button
              href={data.cta.href}
              variant="tertiary"
              className="cursor-pointer transition-opacity hover:opacity-70"
            >
              {data.cta.label}
            </Button>
          </div>
        ) : null}
      </ContentWidth>
    </section>
  )
}
