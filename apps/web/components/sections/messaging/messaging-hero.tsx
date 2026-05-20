import { TechDetailHero } from '@acid-info/logos-ui'
import type { HeroSection } from '@repo/content/schemas'

import { Reveal } from '@/components/motion/reveal'
import { Button, ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'

import { DownloadIcon } from '../shared/builder-cta-card'

type Props = {
  data: HeroSection
  backHref: string
}

export default function MessagingHero({ data, backHref }: Props) {
  const [primaryCta, secondaryCta] = data.ctas ?? []

  return (
    <Reveal amount={0.2}>
      <TechDetailHero
        title={data.headline}
        body={data.body}
        bodySecondary={data.bodySecondary}
        items={data.items}
        backLink={
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
        }
        status={
          data.status
            ? {
                label: data.status.label,
                body: data.status.body,
                cta: data.status.cta ? (
                  <Button
                    href={data.status.cta.href}
                    variant={data.status.cta.variant ?? 'secondary'}
                    icon={<DownloadIcon />}
                    className="w-fit cursor-pointer rounded-none"
                  >
                    {data.status.cta.label}
                  </Button>
                ) : null,
                secondaryCta: data.status.secondaryCta ? (
                  <Button
                    href={data.status.secondaryCta.href}
                    variant={data.status.secondaryCta.variant ?? 'tertiary'}
                    className="w-fit cursor-pointer"
                  >
                    {data.status.secondaryCta.label}
                  </Button>
                ) : null,
              }
            : undefined
        }
        actions={
          <>
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
          </>
        }
      />
    </Reveal>
  )
}
