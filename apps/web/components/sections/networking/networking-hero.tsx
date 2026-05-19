import { LogosMark } from '@acid-info/logos-ui'
import type { HeroSection } from '@repo/content/schemas'

import { Button, ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'

type Props = {
  data: HeroSection
  backHref: string
}

export default function NetworkingHero({ data, backHref }: Props) {
  const [primaryCta, secondaryCta] = data.ctas ?? []

  return (
    <section className="mt-10 mb-15 h-[257px] bg-brand-off-white md:mt-[38px] md:mb-25 md:h-[189px]">
      <div className="relative mx-auto h-full max-w-360 px-3 text-brand-dark-green">
        <Link
          href={backHref}
          className="absolute top-[-20px] left-3 inline-flex cursor-pointer items-center gap-1 text-brand-dark-green transition-opacity hover:opacity-70"
        >
          <span className="inline-flex size-3.75 shrink-0 rotate-180 items-center justify-center">
            <ButtonArrowIcon />
          </span>
          <span className="font-mono text-[10px] font-medium leading-[1.3] uppercase">
            {data.eyebrow}
          </span>
        </Link>

        <h1 className="text-h3-serif absolute top-10 left-3 flex items-center gap-3">
          <LogosMark size={22} className="shrink-0 text-gray-03 md:hidden" />
          <LogosMark
            size={26}
            className="hidden shrink-0 text-gray-03 md:block"
          />
          {data.headline}
        </h1>

        <div className="absolute top-[102px] left-3 flex w-[calc(100%-24px)] flex-col gap-10 md:top-10 md:left-181.5 md:w-85.5">
          {data.body ? (
            <p className="text-mono-s text-brand-dark-green">{data.body}</p>
          ) : null}

          <div className="flex items-center gap-3 md:mt-[39px]">
            {primaryCta ? (
              <Button
                href={primaryCta.href}
                variant={primaryCta.variant ?? 'primary'}
              >
                {primaryCta.label}
              </Button>
            ) : null}
            {secondaryCta ? (
              <Button
                href={secondaryCta.href}
                variant={secondaryCta.variant ?? 'secondary'}
              >
                {secondaryCta.label}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
