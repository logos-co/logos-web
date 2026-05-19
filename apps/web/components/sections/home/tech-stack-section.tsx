import type { TechStackOverviewSection } from '@repo/content/schemas'
import Image from 'next/image'

import { LogosMark } from '@acid-info/logos-ui'

import { Button, ButtonArrowIcon } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

import {
  StackCard,
  StackRow,
} from '@/components/sections/technology-stack/stack-item'
import { DownloadIcon } from '@/components/sections/shared/builder-cta-card'

const desktopCardClassName =
  'h-[366px] w-full border-brand-dark-green p-1.5 hover:bg-gray-01'
const desktopRowClassName =
  'h-[196px] w-full border-brand-dark-green hover:bg-gray-01'
const desktopBasecampRowClassName = 'h-[196px] w-full border-brand-dark-green'
const mobileCardClassName =
  'h-[140px] w-full border-brand-dark-green p-1.5 hover:bg-gray-01'
const mobileRowClassName =
  'h-[105px] w-full border-brand-dark-green hover:bg-gray-01'
const mobileBasecampRowClassName = 'h-[105px] w-full border-brand-dark-green'

function formatEyebrow(eyebrow: string) {
  return eyebrow.replaceAll('. ', '.\n')
}

function formatNetworkingTitle(title: string) {
  return title.replace(': ', ':\n')
}

function BasecampRow({
  basecamp,
  className,
}: {
  basecamp: NonNullable<TechStackOverviewSection['basecamp']>
  className: string
}) {
  return (
    <div
      className={`group/basecamp relative flex items-center justify-center overflow-hidden rounded-3xl border border-brand-dark-green px-6 text-center text-brand-dark-green transition-colors duration-200 ${className} hover:border-transparent hover:bg-accent-light-blue`}
    >
      <span className="pointer-events-none absolute top-3 left-3 hidden h-[57px] w-[46px] overflow-hidden opacity-0 transition-opacity duration-200 group-hover/basecamp:opacity-100 md:block">
        <Image
          src="/images/technology-stack/logos-basecamp.jpg"
          alt=""
          fill
          sizes="46px"
          className="object-cover"
        />
      </span>

      {basecamp.cta ? (
        <Button
          href={basecamp.cta.href}
          icon={<DownloadIcon />}
          className="absolute top-2.5 right-2.5 z-10 cursor-pointer md:top-3 md:right-3"
        >
          {basecamp.cta.label}
        </Button>
      ) : null}

      <div className="flex max-w-[222px] flex-col items-center gap-3">
        <span className="text-subhead-sans flex items-center gap-2.5">
          <LogosMark size={14} className="shrink-0 text-gray-03" />
          {basecamp.title}
        </span>
        {basecamp.body ? (
          <p className="text-mono-s hidden text-center opacity-0 transition-opacity duration-200 group-hover/basecamp:opacity-100 md:block">
            {basecamp.body}
          </p>
        ) : null}
      </div>
    </div>
  )
}

type Props = {
  data: TechStackOverviewSection
  /**
   * Where the networking row links to. Page-level concern (the section
   * fixture covers the four pillars; the networking row is a shared link
   * across pages).
   */
  networkingHref: string
  /** Where the foundation row links to. */
  foundationHref: string
}

export default function TechStackSection({
  data,
  networkingHref,
  foundationHref,
}: Props) {
  return (
    <section
      id="tech-stack"
      className="relative h-[1516px] overflow-hidden border-t border-brand-dark-green/10 bg-brand-off-white md:h-[1653px]"
    >
      <div className="relative h-full px-3 md:hidden">
        <p className="text-mono-s absolute top-3 left-3 w-[226px] text-brand-dark-green">
          Disclaimer: This diagram oversimplifies the stack.
        </p>

        {data.eyebrow ? (
          <p className="text-mono-s absolute top-[130px] left-[203px] w-[120px] whitespace-pre-line text-brand-dark-green">
            {formatEyebrow(data.eyebrow)}
          </p>
        ) : null}

        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <Button
            href={ROUTES.buildersHub}
            icon={<ButtonArrowIcon />}
            className="cursor-pointer transition-opacity hover:opacity-70"
          >
            Builder Hub
          </Button>
          {data.cta ? (
            <Button
              href={data.cta.href}
              variant="secondary"
              icon={<ButtonArrowIcon />}
              className="cursor-pointer transition-opacity hover:opacity-70"
            >
              Documentation
            </Button>
          ) : null}
        </div>

        {data.title ? (
          <h2 className="text-h2 absolute top-[193px] left-1/2 w-[464px] -translate-x-1/2 text-center text-brand-dark-green">
            {data.title}
          </h2>
        ) : null}

        <p className="text-mono-s absolute top-[302px] left-[250px] w-[178px] text-brand-dark-green">
          Private-by-default infrastructure is a requirement to make parallel
          societies possible.
        </p>

        <div className="absolute top-[437px] right-3 left-3">
          {data.basecamp ? (
            <BasecampRow
              basecamp={data.basecamp}
              className={mobileBasecampRowClassName}
            />
          ) : null}

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.pillars.map((pillar) => (
              <StackCard
                key={pillar.id}
                label={pillar.title}
                href={pillar.href}
                className={mobileCardClassName}
              />
            ))}
          </div>

          <div className="mt-3 space-y-3">
            <StackRow
              href={networkingHref}
              className={mobileRowClassName}
              labelClassName="whitespace-pre-line"
            >
              {formatNetworkingTitle(data.networkingTitle)}
            </StackRow>
            <StackRow href={foundationHref} className={mobileRowClassName}>
              {data.foundationTitle}
            </StackRow>
          </div>
        </div>
      </div>

      <div className="relative mx-auto hidden h-full max-w-[1440px] md:block">
        <p className="text-mono-s absolute top-[11px] left-3 w-[226px] text-brand-dark-green">
          Disclaimer: Abstract representation of the stack.
        </p>

        {data.eyebrow ? (
          <p className="text-mono-s absolute top-[97px] left-[calc(50%+6px)] w-[226px] whitespace-pre-line text-brand-dark-green">
            {formatEyebrow(data.eyebrow)}
          </p>
        ) : null}

        <div className="absolute top-[11px] right-3 flex items-center gap-1.5">
          <Button
            href={ROUTES.buildersHub}
            icon={<ButtonArrowIcon />}
            className="cursor-pointer transition-opacity hover:opacity-70"
          >
            Builder Hub
          </Button>
          {data.cta ? (
            <Button
              href={data.cta.href}
              variant="secondary"
              icon={<ButtonArrowIcon />}
              className="cursor-pointer transition-opacity hover:opacity-70"
            >
              Documentation
            </Button>
          ) : null}
          <Button
            href={ROUTES.technologyStack}
            variant="secondary"
            icon={<ButtonArrowIcon />}
            className="cursor-pointer transition-opacity hover:opacity-70"
          >
            Specs
          </Button>
        </div>

        {data.title ? (
          <h2 className="text-h2 absolute top-[184px] left-[calc(33.33%+8px)] w-[464px] text-center text-brand-dark-green">
            {data.title}
          </h2>
        ) : null}

        <p className="text-mono-s absolute top-[333px] left-[calc(50%+6px)] w-[226px] text-brand-dark-green">
          Private-by-default infrastructure is a requirement to make parallel
          societies possible.
        </p>

        <div className="absolute top-[517px] left-0 flex w-full flex-col gap-3 px-3">
          {data.basecamp ? (
            <BasecampRow
              basecamp={data.basecamp}
              className={desktopBasecampRowClassName}
            />
          ) : null}

          <div className="grid w-full grid-cols-4 gap-3">
            {data.pillars.map((pillar) => (
              <StackCard
                key={pillar.id}
                label={pillar.title}
                href={pillar.href}
                className={desktopCardClassName}
              />
            ))}
          </div>

          <StackRow
            href={networkingHref}
            className={desktopRowClassName}
            labelClassName="whitespace-pre-line"
          >
            {formatNetworkingTitle(data.networkingTitle)}
          </StackRow>
          <StackRow href={foundationHref} className={desktopRowClassName}>
            {data.foundationTitle}
          </StackRow>
        </div>
      </div>
    </section>
  )
}
