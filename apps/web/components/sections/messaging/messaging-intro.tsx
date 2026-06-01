import Image from 'next/image'
import type { ReactNode } from 'react'

import { TechTextSplitSection } from '@acid-info/logos-ui'
import type { CtaPanelSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Reveal } from '@/components/motion/reveal'
import { OverviewMediaPanel } from '@/components/sections/shared/overview-media-panel'

function paragraphs(text?: string) {
  return text?.split('\n\n') ?? []
}

function DeliveryImage() {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-gray-02 md:h-full">
      <Image
        src="/images/messaging/delivery-landscape.webp"
        alt=""
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/20" />
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
  return (
    <section className="bg-brand-off-white">
      <ContentWidth className="!p-0">
        <Reveal amount={0.2}>
          <OverviewMediaPanel
            eyebrow={data.eyebrow}
            mobileEyebrow={data.mobileEyebrow}
            title={data.title}
            mobileTitle={data.mobileTitle}
            body={data.description ? [data.description] : undefined}
            mobileBody={
              data.mobileDescription ? [data.mobileDescription] : undefined
            }
            cta={data.cta}
            secondaryCta={data.secondaryCta}
            image={image}
            imagePosition={reverse ? 'left' : 'right'}
            tone={tone}
            size="compact"
          />
        </Reveal>
      </ContentWidth>
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
