import Image from 'next/image'
import type { ReactNode } from 'react'

import { TechTextSplitSection } from '@acid-info/logos-ui'
import type { CtaPanelSection } from '@repo/content/schemas'

import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui'

import { SectionMarker } from './messaging-shared'

function paragraphs(text?: string) {
  return text?.split('\n\n') ?? []
}

function ctaAttrs(external?: boolean) {
  return external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

function MessagingFeatureActions({ data }: { data: CtaPanelSection }) {
  if (!data.cta && !data.secondaryCta) {
    return null
  }

  return (
    <div className="flex items-baseline gap-1.5">
      {data.cta ? (
        <Button
          href={data.cta.href}
          variant={data.cta.variant ?? 'primary'}
          className="cursor-pointer"
          {...ctaAttrs(data.cta.external)}
        >
          {data.cta.label}
        </Button>
      ) : null}
      {data.secondaryCta ? (
        <Button
          href={data.secondaryCta.href}
          variant={data.secondaryCta.variant ?? 'secondary'}
          className="cursor-pointer"
          {...ctaAttrs(data.secondaryCta.external)}
        >
          {data.secondaryCta.label}
        </Button>
      ) : null}
    </div>
  )
}

function DeliveryImage() {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-gray-02 md:h-full">
      <div className="absolute top-[-82px] left-[-20px] h-[497px] w-[397px] max-w-none md:top-[calc(50%+12px)] md:left-0 md:h-[620px] md:w-full md:-translate-y-1/2">
        <div className="relative h-full w-full md:h-[702px] md:w-[620px] md:rotate-90">
          <Image
            src="/images/messaging/delivery.webp"
            alt=""
            fill
            sizes="(min-width: 768px) 702px, 397px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      </div>
    </div>
  )
}

function ChatImage() {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-gray-02 md:h-full">
      <Image
        src="/images/messaging/chat.webp"
        alt=""
        width={1044}
        height={1094}
        sizes="(min-width: 768px) 743px, 461px"
        className="absolute top-[-25px] left-[-38px] h-[461px] w-[461px] max-w-none object-cover md:top-[calc(50%-68px)] md:left-0 md:h-[778px] md:w-[743px] md:-translate-y-1/2"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 from-[25.835%] to-transparent to-1/2" />
    </div>
  )
}

function MessagingFeaturePanel({
  data,
  image,
  tone = 'gray-01',
  reverse = false,
}: {
  data: CtaPanelSection
  image: ReactNode
  tone?: 'gray-01' | 'gray-02'
  reverse?: boolean
}) {
  const mobileEyebrow = data.mobileEyebrow ?? data.eyebrow
  const mobileTitle = data.mobileTitle ?? data.title
  const mobileDescription = data.mobileDescription ?? data.description

  return (
    <section className="bg-brand-off-white">
      <div
        className={`mx-auto max-w-[1440px] p-3 ${
          tone === 'gray-02' ? 'bg-gray-02' : 'bg-gray-01'
        }`}
      >
        <div
          className={`relative grid gap-3 md:h-[335px] md:grid-cols-2 ${
            reverse ? 'md:[&>*:first-child]:col-start-2' : ''
          }`}
        >
          <Reveal className="flex min-h-72 flex-col justify-between text-brand-dark-green md:h-full md:w-full md:pb-3">
            {mobileEyebrow ? (
              <SectionMarker
                label={mobileEyebrow}
                className="h-[98px] md:hidden"
              />
            ) : null}
            {data.eyebrow ? (
              <SectionMarker
                label={data.eyebrow}
                className="hidden h-[98px] md:flex"
              />
            ) : null}

            <div className="flex w-[345px] max-w-full min-w-0 flex-col gap-3 break-words md:w-full">
              <h2 className="font-sans text-[24px] leading-[1.1] font-normal tracking-[-0.24px] md:w-[336px]">
                <span className="md:hidden">{mobileTitle}</span>
                <span className="hidden md:inline">{data.title}</span>
              </h2>
              {mobileDescription ? (
                <p className="w-[345px] max-w-full font-sans text-[12px] leading-[1.2] font-medium break-words md:hidden">
                  {mobileDescription}
                </p>
              ) : null}
              {data.description ? (
                <p className="hidden font-sans text-[12px] leading-[1.2] font-medium md:block md:w-[485px]">
                  {data.description}
                </p>
              ) : null}
            </div>

            <MessagingFeatureActions data={data} />
          </Reveal>

          <Reveal
            amount={0.2}
            className={`h-72 md:h-full ${
              reverse ? 'md:col-start-1 md:row-start-1' : ''
            }`}
          >
            {image}
          </Reveal>
        </div>
      </div>
    </section>
  )
}

type Props = {
  /** First block — shared blockchain-style split text overview. */
  privacy: CtaPanelSection
  /** Second block — eyebrow + title + body (no CTA) with the LMN image. */
  lmn: CtaPanelSection
  /** Third block — privacy/censorship messaging feature. */
  censorship: CtaPanelSection
}

export default function MessagingIntro({ privacy, lmn, censorship }: Props) {
  return (
    <>
      <Reveal amount={0.2}>
        <TechTextSplitSection
          className="mb-15 md:mb-[100px] md:h-[235px]"
          title={privacy.title}
          body={
            <>
              {privacy.mobileDescription ? (
                <div className="flex flex-col gap-5 md:hidden">
                  {paragraphs(privacy.mobileDescription).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
              {privacy.description ? (
                <div className="hidden flex-col gap-5 md:flex">
                  {paragraphs(privacy.description).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
            </>
          }
        />
      </Reveal>

      <MessagingFeaturePanel
        data={lmn}
        image={<DeliveryImage />}
        tone="gray-02"
      />
      <MessagingFeaturePanel data={censorship} image={<ChatImage />} reverse />
    </>
  )
}
