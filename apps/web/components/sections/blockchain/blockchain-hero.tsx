import { LogosMark } from '@acid-info/logos-ui'
import type { HeroSection } from '@repo/content/schemas'

import { Button, ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'

type Props = {
  data: HeroSection
  backHref: string
}

export default function BlockchainHero({ data, backHref }: Props) {
  const [primaryCta, secondaryCta] = data.ctas ?? []

  return (
    <section className="bg-brand-off-white">
      <div className="relative z-51 mx-auto max-w-360 px-3 pt-8">
        <Link
          href={backHref}
          className="inline-flex cursor-pointer items-center gap-1 text-brand-dark-green transition-opacity hover:opacity-70"
        >
          <span className="inline-flex size-3.75 shrink-0 rotate-180 items-center justify-center">
            <ButtonArrowIcon />
          </span>
          <span className="font-mono text-[10px] font-medium leading-[1.3] uppercase">
            {data.eyebrow}
          </span>
        </Link>
      </div>

      <div className="mx-auto max-w-360 px-3 pt-10 pb-10">
        {/* Desktop: absolute layout matches Figma x-coordinates */}
        <div className="relative hidden md:block md:h-13">
          <div className="absolute top-0 left-0 flex items-center gap-3">
            <LogosMark size={26} className="shrink-0 text-gray-03" />
            <h1 className="text-h3-serif leading-none text-brand-dark-green">
              {data.headline}
            </h1>
          </div>

          {data.body ? (
            <p className="text-mono-s absolute top-0 left-178.5 w-85.5 text-black">
              {data.body}
            </p>
          ) : null}

          {primaryCta ? (
            <div className="absolute top-0 left-297.5">
              <Button href={primaryCta.href} variant="secondary">
                {primaryCta.label}
              </Button>
            </div>
          ) : null}

          {secondaryCta ? (
            <div className="absolute top-2 left-327.25">
              <Button href={secondaryCta.href} variant="tertiary">
                {secondaryCta.label}
              </Button>
            </div>
          ) : null}
        </div>

        {/* Mobile: vertical stack */}
        <div className="flex flex-col gap-10 md:hidden">
          <div className="flex items-center gap-3">
            <LogosMark size={26} className="shrink-0 text-gray-03" />
            <span className="text-h3-serif leading-none text-brand-dark-green">
              {data.headline}
            </span>
          </div>

          <div className="flex flex-col gap-10">
            {data.body ? (
              <p className="text-mono-s text-black">{data.body}</p>
            ) : null}

            <div className="flex items-baseline gap-3">
              {primaryCta ? (
                <Button href={primaryCta.href} variant="secondary">
                  {primaryCta.label}
                </Button>
              ) : null}
              {secondaryCta ? (
                <Button href={secondaryCta.href} variant="tertiary">
                  {secondaryCta.label}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
