import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'

interface HeroProps {
  heading: string
  intro: string
}

export function Hero({ heading, intro }: HeroProps) {
  return (
    <section className="relative mb-15 h-[200px] w-full md:mb-25 md:h-[258px]">
      <ContentWidth className="relative h-full">
        <div className="absolute top-[60px] left-3 flex items-center gap-3 md:top-[90px]">
          <LogosMark size={28} className="w-5 shrink-0 text-gray-03" />
          <h1 className="font-display text-[30px] leading-none tracking-[-0.9px] md:text-[36px] md:tracking-[-1.08px]">
            {heading}
          </h1>
        </div>
        <p className="absolute top-[126px] left-3 max-w-[342px] whitespace-pre-line font-mono text-[10px] leading-[1.3] md:top-[90px] md:left-[calc(50%+6px)] md:max-w-[345px]">
          {intro}
        </p>
      </ContentWidth>
    </section>
  )
}
