import Image from 'next/image'

import type { HeroSection } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import ContentWidth from '@/components/layout/content-width'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui'

type Props = {
  data: HeroSection
}

function DownloadIcon() {
  return <IconMask src="/icons/download.svg" className="size-[15px]" />
}

function getButtonIcon(iconOverride?: string) {
  if (iconOverride === 'download') {
    return <DownloadIcon />
  }
  if (iconOverride === 'none') {
    return false
  }
  return undefined
}

function StatusCard({
  status,
  compact = false,
}: {
  status: NonNullable<HeroSection['status']>
  compact?: boolean
}) {
  return (
    <div
      className={
        compact
          ? 'relative w-[393px] rounded-xl'
          : 'relative w-full rounded-xl px-3 py-3'
      }
    >
      <div className="flex flex-col items-start gap-2">
        <span className="text-eyebrow font-semibold leading-[1.35] rounded bg-[#ffd328] px-1 py-0.5 text-brand-dark-green uppercase">
          {status.label}
        </span>
        <p
          className={`text-mono-s text-brand-dark-green ${
            compact ? 'w-[345px]' : 'w-full max-w-[680px]'
          }`}
        >
          {status.body}
          {status.secondaryCta ? (
            <>
              {' '}
              <Button
                href={status.secondaryCta.href}
                variant="link"
                icon={false}
                className="inline-flex cursor-pointer align-baseline"
              >
                {status.secondaryCta.label}
              </Button>
            </>
          ) : null}
        </p>
        {status.cta ? (
          <Button
            href={status.cta.href}
            variant={status.cta.variant ?? 'secondary'}
            icon={getButtonIcon(status.cta.iconOverride)}
            className="cursor-pointer"
          >
          {status.cta.label}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default function TechOverviewHero({ data }: Props) {
  return (
    <section className="relative mb-10 h-[743px] overflow-hidden bg-brand-off-white px-3 pt-10 pb-0 md:mb-25 md:h-[660px] md:pt-8 md:pb-0 xl:h-[486px]">
      <ContentWidth className="relative h-[500px] md:h-[600px] xl:h-[403px]">
        <div className="absolute top-0 left-0 hidden h-[99px] w-[393px] md:block">
          {data.status ? <StatusCard status={data.status} compact /> : null}
        </div>

        <div className="hidden md:block">
          <p className="text-mono-s absolute top-0 left-[calc(50%+6px)] w-[calc(50%-18px)] max-w-[226px] text-brand-dark-green xl:left-[714px] xl:w-[226px] xl:max-w-none">
            {data.eyebrow}
          </p>
          <p className="text-mono-s absolute top-[310px] left-[calc(50%+6px)] w-[calc(50%-18px)] max-w-[226px] text-brand-dark-green xl:left-[714px] xl:w-[226px] xl:max-w-none">
            {data.body}
          </p>
          {data.ctas && data.ctas.length > 0 ? (
            <div className="absolute top-[412px] left-[calc(50%+6px)] flex max-w-[calc(50%-18px)] flex-col items-start gap-2.5 xl:left-[714px] xl:max-w-none xl:flex-row">
              {data.ctas.map((cta) => (
                <Button
                  key={cta.label}
                  href={cta.href}
                  variant={cta.variant ?? 'secondary'}
                  icon={getButtonIcon(cta.iconOverride)}
                  className="cursor-pointer"
                >
                  {cta.label}
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="md:hidden">
          <div className="absolute top-2.5 left-0 h-[75px] w-[107px] overflow-hidden">
            <div className="absolute top-[-29px] left-[-48px] h-[208px] w-[166px]">
              <Image
                src={
                  data.background?.src ??
                  '/images/technology-stack/header-top.jpg'
                }
                alt={data.background?.alt ?? ''}
                fill
                sizes="166px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
          </div>
          <p className="text-mono-s absolute top-2.5 left-[calc(50%+6px)] w-[178px] text-brand-dark-green">
            {data.eyebrow}
          </p>
        </div>

        <Reveal className="absolute top-[126px] left-1/2 w-[464px] max-w-none -translate-x-1/2 md:top-[115px] xl:left-[476px] xl:translate-x-0">
          <h1 className="text-h2 text-center text-brand-dark-green">
            {data.headline === 'The Logos Technology Stack' ? (
              <>
                <span className="block">The Logos</span>
                <span className="block">Technology Stack</span>
              </>
            ) : (
              data.headline
            )}
          </h1>
        </Reveal>

        <p className="text-mono-s absolute top-[259px] left-[calc(50%+6px)] w-[178px] text-brand-dark-green md:hidden">
          {data.body}
        </p>

        {data.ctas && data.ctas.length > 0 ? (
          <div className="absolute top-[387px] left-[calc(50%+6px)] flex w-[178px] flex-col items-start gap-2.5 md:hidden">
            {data.ctas.map((cta) => (
              <Button
                key={cta.label}
                href={cta.href}
                variant={cta.variant ?? 'secondary'}
                icon={getButtonIcon(cta.iconOverride)}
                className="cursor-pointer"
              >
                {cta.label}
              </Button>
            ))}
          </div>
        ) : null}
      </ContentWidth>
      <div className="absolute top-[620px] left-0 h-10 w-full px-3 md:hidden">
        <div className="h-px w-full bg-brand-dark-green/10" />
      </div>
      <div className="absolute bottom-10 left-0 hidden h-10 w-full px-3 md:block xl:hidden">
        <div className="h-px w-full bg-brand-dark-green/10" />
      </div>
      {data.status ? (
        <div className="absolute top-[620px] left-0 w-full md:hidden">
          <StatusCard status={data.status} />
        </div>
      ) : null}
    </section>
  )
}
