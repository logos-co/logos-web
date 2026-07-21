import ContentWidth from '@/components/layout/content-width'
import { LambdaLockup } from '@/components/ui/lambda-lockup'

interface HeroProps {
  heading: string
  intro: string
}

export function Hero({ heading, intro }: HeroProps) {
  return (
    <section className="relative mb-15 h-[200px] w-full md:mb-25 md:h-[258px]">
      <ContentWidth className="relative h-full">
        <LambdaLockup
          className="absolute top-[60px] left-3 [--lockup-font-size:30px] md:top-[90px] md:[--lockup-font-size:36px]"
          markClassName="text-gray-03"
        >
          <h1 className="font-display text-[30px] leading-none tracking-[-0.9px] md:text-[36px] md:tracking-[-1.08px]">
            {heading}
          </h1>
        </LambdaLockup>
        <p className="absolute top-[126px] left-3 max-w-[342px] whitespace-pre-line font-mono text-[10px] leading-[1.3] md:top-[90px] md:left-[calc(50%+6px)] md:max-w-[345px]">
          {intro}
        </p>
      </ContentWidth>
    </section>
  )
}
