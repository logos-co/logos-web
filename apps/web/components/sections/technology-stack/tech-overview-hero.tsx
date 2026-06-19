import Image from 'next/image'

import type { HeroSection } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import ContentWidth from '@/components/layout/content-width'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui'
import { resolveBasecampInstallCtaLinkProps } from '@/lib/basecamp-release-links'

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
          : 'relative w-full rounded-xl py-3'
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
            {...resolveBasecampInstallCtaLinkProps(status.cta)}
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
    <section className="relative mb-13 bg-brand-off-white px-3 pt-10 pb-13 md:mb-25 md:pt-8 md:pb-20">
      <ContentWidth className="relative flex flex-col gap-10 md:gap-[70px]">
        {/* Status card — desktop, anchored top-left over the spine */}
        <div className="absolute top-0 left-0 hidden h-[99px] w-[393px] md:block">
          {data.status ? <StatusCard status={data.status} compact /> : null}
        </div>

        {/* Header image — mobile, anchored top-left over the spine */}
        <div className="absolute top-2.5 left-0 h-[75px] w-[107px] overflow-hidden md:hidden">
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

        {/* Eyebrow — right column */}
        <p className="text-mono-s ml-[calc(50%+6px)] w-[calc(50%-18px)] max-w-[178px] whitespace-pre-line text-brand-dark-green md:max-w-[226px] xl:w-[226px] xl:max-w-none">
          {data.eyebrow}
        </p>

        {/* Headline */}
        <Reveal className="w-full md:w-[464px] md:self-center xl:ml-[464px] xl:self-start">
          <h1 className="text-h2 text-center whitespace-pre-line text-brand-dark-green">
            {data.headline}
          </h1>
        </Reveal>

        {/* Body + CTAs — right column */}
        <div className="ml-[calc(50%+6px)] flex w-[calc(50%-18px)] max-w-[178px] flex-col items-start gap-6 md:max-w-[226px] xl:w-[226px] xl:max-w-none">
          <p className="text-mono-s text-brand-dark-green">{data.body}</p>
          {data.ctas && data.ctas.length > 0 ? (
            <div className="flex flex-col items-start gap-2.5 xl:flex-row">
              {data.ctas.map((cta) => (
                <Button
                  key={cta.label}
                  {...resolveBasecampInstallCtaLinkProps(cta)}
                  variant={cta.variant ?? 'secondary'}
                  icon={getButtonIcon(cta.iconOverride)}
                  className="cursor-pointer"
                >
                  {cta.label}
                </Button>
              ))}
            </div>
          ) : null}
          <div className="mt-4 hidden h-px w-[calc(100vw-24px)] -translate-x-[calc(50vw-6px)] bg-brand-dark-green/10 lg:block xl:hidden" />
        </div>

        {/* Divider + status — mobile only */}
        <div className="md:hidden">
          <div className="h-px w-full bg-brand-dark-green/10" />
          {data.status ? (
            <div className="mt-6">
              <StatusCard status={data.status} />
            </div>
          ) : null}
        </div>
      </ContentWidth>
    </section>
  )
}
