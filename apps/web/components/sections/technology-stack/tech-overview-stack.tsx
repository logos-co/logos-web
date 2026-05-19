import Image from 'next/image'
import type { ReactNode } from 'react'

import { LogosMark } from '@acid-info/logos-ui'
import type { TechStackOverviewSection } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import { Button } from '@/components/ui'
import { Link } from '@/i18n/navigation'

function SectionMarker({ label }: { label: string }) {
  return (
    <div className="text-mono-s flex items-center gap-[102px] text-brand-dark-green">
      <span className="size-[7px] rotate-45 bg-brand-dark-green" />
      <span>{label}</span>
    </div>
  )
}

function DownloadIcon() {
  return <IconMask src="/icons/download.svg" className="size-[15px]" />
}

type StackTileProps = {
  title: string
  body?: string
  href: string
  className: string
  children?: ReactNode
}

function StackTile({ title, body, href, className, children }: StackTileProps) {
  return (
    <Link
      href={href}
      className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-brand-dark-green text-center text-brand-dark-green ${className}`}
    >
      <div className="flex flex-col items-center gap-3 px-3 py-1">
        <span className="text-subhead-sans flex items-center gap-2.5">
          <span className="hidden shrink-0 md:block">
            <LogosMark size={14} />
          </span>
          {title}
        </span>
        {body ? (
          <p className="text-mono-s w-[152px] md:hidden">{body}</p>
        ) : null}
      </div>
      {children}
    </Link>
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
  /** Where the foundation row links to. Same rationale as `networkingHref`. */
  foundationHref: string
}

export default function TechOverviewStack({
  data,
  networkingHref,
  foundationHref,
}: Props) {
  const [networkLine1, networkLine2] = data.networkingTitle.split('\n')

  return (
    <section
      id="stack"
      className="bg-brand-off-white px-3 pb-[27px] md:pb-[100px]"
    >
      <div className="mx-auto max-w-354">
        {data.architecture ? (
          <div className="grid gap-3 pb-[52px] md:grid-cols-2 md:pb-[100px]">
            <div className="relative h-[317px] md:h-[357px]">
              {data.architecture.eyebrow ? (
                <div className="absolute top-3 left-0 md:top-3">
                  <SectionMarker label={data.architecture.eyebrow} />
                </div>
              ) : null}

              <div className="absolute top-[62px] left-0 max-w-[485px] md:top-[89px]">
                <h2 className="text-h4-sans text-brand-dark-green">
                  {data.architecture.title}
                </h2>
                <div className="text-body-sans mt-3 flex flex-col gap-3 text-brand-dark-green md:mt-4">
                  {data.architecture.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {data.architecture.cta ? (
                  <Button
                    href={data.architecture.cta.href}
                    variant="secondary"
                    className="mt-6 cursor-pointer"
                  >
                    {data.architecture.cta.label}
                  </Button>
                ) : null}
              </div>

              <div className="absolute top-[304px] left-0 md:top-[344px]">
                <SectionMarker label={data.pillars[0].title} />
              </div>
            </div>

            <div className="relative h-[317px] overflow-hidden rounded-xl md:h-[357px]">
              <div className="absolute top-[-53px] left-0 h-[936px] w-[702px] md:top-[-33px]">
                <Image
                  src={data.architecture.image.src}
                  alt={data.architecture.image.alt}
                  fill
                  sizes="702px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-[60px] md:gap-[100px]">
          <div className="grid gap-3 pt-[100px] md:grid-cols-2">
            {data.title ? (
              <h2 className="text-h4-sans md:text-h3-sans text-brand-dark-green">
                {data.title}
              </h2>
            ) : null}
            {data.eyebrow ? (
              <p className="text-mono-s w-[226px] text-brand-dark-green">
                {data.eyebrow}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            {data.basecamp ? (
              <div className="relative flex h-[111px] flex-col items-start justify-center overflow-hidden rounded-xl border border-brand-dark-green p-3 text-brand-dark-green md:h-[196px] md:items-center md:rounded-3xl">
                <span className="text-subhead-sans flex items-center gap-2.5">
                  <span className="hidden shrink-0 md:block">
                    <LogosMark size={14} />
                  </span>
                  {data.basecamp.title}
                </span>
                {data.basecamp.body ? (
                  <p className="text-mono-s mt-3 w-[208px] md:hidden">
                    {data.basecamp.body}
                  </p>
                ) : null}
                {data.basecamp.cta ? (
                  <Button
                    href={data.basecamp.cta.href}
                    variant="primary"
                    icon={<DownloadIcon />}
                    className="absolute top-2.5 right-2.5 cursor-pointer md:hidden"
                  >
                    {data.basecamp.cta.label}
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {data.pillars.map((pillar) => (
                <StackTile
                  key={pillar.id}
                  title={pillar.title}
                  body={pillar.body}
                  href={pillar.href}
                  className="h-[258px] md:h-[366px]"
                >
                  {pillar.id === 'blockchain' ? (
                    <div className="mt-3 flex w-full flex-col gap-1.5 px-1.5 md:hidden">
                      <div className="text-eyebrow rounded-[18px] border border-brand-dark-green/50 px-3 py-3 uppercase">
                        Logos Execution Zone (LEZ)
                      </div>
                      <div className="text-eyebrow rounded-[18px] border border-brand-dark-green/50 px-3 py-3 uppercase">
                        Data Availability and Consensus: Cryptarchia
                      </div>
                    </div>
                  ) : null}
                </StackTile>
              ))}
            </div>

            <Link
              href={networkingHref}
              className="flex h-[196px] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-brand-dark-green px-3 text-center text-brand-dark-green"
            >
              <span className="text-subhead-sans">
                <span className="block">{networkLine1}</span>
                {networkLine2 ? (
                  <span className="block">{networkLine2}</span>
                ) : null}
              </span>
              {data.networkingDescription ? (
                <p className="text-mono-s w-[208px] md:hidden">
                  {data.networkingDescription}
                </p>
              ) : null}
            </Link>

            <Link
              href={foundationHref}
              className="flex h-[196px] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-brand-dark-green px-3 text-center text-brand-dark-green"
            >
              <span className="text-subhead-sans">{data.foundationTitle}</span>
              {data.foundationDescription ? (
                <p className="text-mono-s w-[208px] md:hidden">
                  {data.foundationDescription}
                </p>
              ) : null}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
