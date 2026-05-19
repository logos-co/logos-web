import type { CtaPanelSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

type Props = {
  data: CtaPanelSection
}

export default function NetworkingIntro({ data }: Props) {
  return (
    <section className="h-[235px] border-t border-brand-dark-green/10 bg-brand-off-white md:h-[158px]">
      <div className="relative mx-auto h-full max-w-360 px-3 text-brand-dark-green">
        <h2 className="text-h4-sans absolute top-10 left-3">{data.title}</h2>

        {data.description ? (
          <p className="text-mono-s absolute top-[78px] left-3 w-[calc(100%-48px)] md:top-10 md:left-181.5 md:w-86.25">
            {data.description}
          </p>
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
      </div>
    </section>
  )
}
