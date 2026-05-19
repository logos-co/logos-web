import { LogosMark } from '@acid-info/logos-ui'
import type { HeroSection } from '@repo/content/schemas'

import { Button, ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'

import { DownloadIcon } from '../shared/builder-cta-card'

type Props = {
  data: HeroSection
  backHref: string
}

export default function BlockchainHero({ data, backHref }: Props) {
  const [primaryCta, secondaryCta] = data.ctas ?? []

  return (
    <section className="bg-brand-off-white pt-8 md:pt-12">
      <div className="relative z-51 mx-auto max-w-360 px-3">
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

      <div className="mx-auto grid max-w-360 gap-10 px-3 pt-8 pb-10 text-brand-dark-green md:grid-cols-4 md:gap-3 md:pt-12 md:pb-23">
        <h1 className="text-h3-serif flex self-start items-center gap-3 md:col-span-2">
          <LogosMark size={42} className="shrink-0 text-gray-03" />
          {data.headline}
        </h1>

        <div className="flex flex-col gap-8 md:col-span-2 md:grid md:grid-cols-2 md:gap-3">
          <div className="flex flex-col gap-6">
            {data.body ? (
              <p className="text-mono-s max-w-86 text-black">{data.body}</p>
            ) : null}

            {data.bodySecondary ? (
              <div className="text-mono-s flex flex-col gap-3 text-black">
                <p>{data.bodySecondary}</p>
                {data.items?.map((item) => (
                  <p key={item.title}>
                    <span className="font-mono font-semibold">
                      {item.title}
                    </span>
                    {item.description ? ` — ${item.description}` : null}
                  </p>
                ))}
              </div>
            ) : null}

            {data.status ? (
              <div className="border-brand-dark-green/10 flex flex-col gap-6 border-t pt-6">
                <span className="text-eyebrow w-fit rounded bg-brand-yellow px-1 py-0.5 text-brand-dark-green">
                  {data.status.label}
                </span>
                <p className="text-mono-s max-w-86 text-black">
                  {data.status.body}
                </p>
                {data.status.cta ? (
                  <Button
                    href={data.status.cta.href}
                    variant={data.status.cta.variant ?? 'secondary'}
                    icon={<DownloadIcon />}
                    className="w-fit cursor-pointer rounded-none"
                  >
                    {data.status.cta.label}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="order-first flex flex-wrap items-start gap-3 md:order-none md:flex-col md:items-start">
            {primaryCta ? (
              <Button href={primaryCta.href} variant="tertiary">
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
    </section>
  )
}
