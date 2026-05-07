import Image from 'next/image'
import type { ReactNode } from 'react'

import { LogosMark } from '@repo/ui'
import type { CardGridSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

function SectionEyebrow({
  label,
  className = '',
}: {
  label: string
  className?: string
}) {
  return (
    <div className={`flex items-start gap-25.5 ${className}`}>
      <LogosMark size={9} className="shrink-0 text-brand-dark-green" />
      <p className="text-eyebrow w-46.25 text-brand-dark-green">{label}</p>
    </div>
  )
}

function Card({ label, body }: { label: string; body: string }) {
  return (
    <div className="flex items-start rounded-xl bg-gray-01 p-3">
      <div className="flex flex-1 flex-col gap-0.5 pr-1.5">
        <p className="text-eyebrow text-brand-dark-green">{label}</p>
        <p className="text-mono-s text-brand-dark-green">{body}</p>
      </div>
    </div>
  )
}

/**
 * Cryptarchia image — matches Figma node 40009046:21154 / 40009046:21057
 * Source asset 2560×3200 is displayed at 755×943 and positioned at
 * (-28, -172) inside a 702×576 container. On mobile the container is
 * 369×576 — same over-sized image crop starting from the left.
 */
function CryptarchiaImage({
  sizes = '702px',
  className = '',
  children,
}: {
  sizes?: string
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl ${className}`}>
      <Image
        src="/images/blockchain/cryptarchia.jpg"
        alt=""
        width={755}
        height={943}
        sizes={sizes}
        className="absolute top--43 left-[-28px] h-[943px] w-[755px] max-w-none object-cover"
      />
      {children}
    </div>
  )
}

type Props = {
  data: CardGridSection
}

export default function BlockchainCryptarchia({ data }: Props) {
  const [blendCard, lezCard] = data.cards

  return (
    <section className="bg-gray-02">
      {/* Desktop: 1440×600, image left + centered text right */}
      <div className="mx-auto hidden max-w-360 p-3 md:block">
        <div className="flex h-144 items-start justify-between">
          <CryptarchiaImage className="h-144 w-175.5">
            <div className="absolute right-3 bottom-3 left-3 flex items-start gap-3">
              {blendCard ? (
                <div className="flex-1">
                  <Card label={blendCard.title} body={blendCard.description ?? ''} />
                </div>
              ) : null}
              {lezCard ? (
                <div className="flex-1">
                  <Card label={lezCard.title} body={lezCard.description ?? ''} />
                </div>
              ) : null}
            </div>
          </CryptarchiaImage>

          <div className="flex h-full w-175.5 flex-col justify-between pb-3">
            {data.eyebrow ? <SectionEyebrow label={data.eyebrow} /> : null}

            <div className="flex flex-col items-center justify-center gap-1.5 text-center text-brand-dark-green">
              {data.heading ? (
                <p className="text-h4-sans w-53.5">{data.heading}</p>
              ) : null}
              {data.subheading ? (
                <p className="w-76.25 font-sans text-[12px] leading-[1.2] font-medium">
                  {data.subheading}
                </p>
              ) : null}
            </div>

            {data.eyebrow ? (
              <SectionEyebrow label={data.eyebrow} className="opacity-0" />
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile: stacked — text (288h) + image (576h with 2 cards at bottom) */}
      <div className="mx-auto flex max-w-360 flex-col gap-3 p-3 md:hidden">
        <div className="flex h-72 flex-col justify-between">
          {data.eyebrow ? <SectionEyebrow label={data.eyebrow} /> : null}

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 text-brand-dark-green">
              {data.heading ? (
                <p className="text-h4-sans">{data.heading}</p>
              ) : null}
              {data.subheading ? (
                <p className="font-sans text-[12px] leading-[1.2] font-medium">
                  {data.subheading}
                </p>
              ) : null}
            </div>
            {data.cta ? (
              <Button
                href={data.cta.href}
                variant="primary"
                className="w-fit cursor-pointer"
              >
                {data.cta.label}
              </Button>
            ) : null}
          </div>

          {data.eyebrow ? (
            <SectionEyebrow label={data.eyebrow} className="opacity-0" />
          ) : null}
        </div>

        <CryptarchiaImage sizes="100vw" className="h-144 w-full">
          <div className="absolute right-3 bottom-3 left-3 flex flex-col gap-3">
            {blendCard ? (
              <Card label={blendCard.title} body={blendCard.description ?? ''} />
            ) : null}
            {lezCard ? (
              <Card label={lezCard.title} body={lezCard.description ?? ''} />
            ) : null}
          </div>
        </CryptarchiaImage>
      </div>
    </section>
  )
}
