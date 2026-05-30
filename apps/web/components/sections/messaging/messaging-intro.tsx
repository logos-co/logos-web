import Image from 'next/image'
import type { ReactNode } from 'react'

import { TechTextSplitSection } from '@acid-info/logos-ui'
import type { CtaPanelSection } from '@repo/content/schemas'

import { Reveal } from '@/components/motion/reveal'

import { SectionMarker } from './messaging-shared'

function paragraphs(text?: string) {
  return text?.split('\n\n') ?? []
}

function LmnImage() {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-gray-02 md:aspect-[702/335] md:h-auto md:w-full">
      <Image
        src="/images/messaging/lmn.webp"
        alt=""
        width={746}
        height={933}
        sizes="(min-width: 1920px) 927px, (min-width: 768px) 702px, 369px"
        className="absolute top-[-93px] left-[-28px] h-[497px] w-[397px] max-w-none object-cover md:top-[-38.96%] md:left-[2.99%] md:h-[185.08%] md:w-[110.4%]"
      />
    </div>
  )
}

function PrivacyImage() {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-gray-02 md:aspect-[702/335] md:h-auto md:w-full">
      <Image
        src="/images/messaging/privacy.webp"
        alt=""
        width={746}
        height={933}
        sizes="(min-width: 1920px) 927px, (min-width: 768px) 702px, 369px"
        className="absolute top-[-25px] left-[-38px] h-[461px] w-[461px] max-w-none object-cover md:top-[-86.42%] md:left-0 md:h-[232.24%] md:w-[105.84%]"
      />
    </div>
  )
}

function MessagingFeaturePanel({
  data,
  image,
  reverse = false,
}: {
  data: CtaPanelSection
  image: ReactNode
  reverse?: boolean
}) {
  const mobileEyebrow = data.mobileEyebrow ?? data.eyebrow
  const mobileTitle = data.mobileTitle ?? data.title
  const mobileDescription = data.mobileDescription ?? data.description

  return (
    <section>
      <div className="mx-auto max-w-[1920px] bg-gray-01 p-3">
        <div
          className={`relative h-150 md:grid md:h-auto md:grid-cols-2 md:items-start md:gap-3 ${
            reverse ? 'md:[&>*:first-child]:col-start-2' : ''
          }`}
        >
          <Reveal className="flex h-72 flex-col md:aspect-[702/335] md:h-auto md:w-full">
            {mobileEyebrow ? (
              <SectionMarker label={mobileEyebrow} className="md:hidden" />
            ) : null}
            {data.eyebrow ? (
              <SectionMarker label={data.eyebrow} className="hidden md:flex" />
            ) : null}

            <div className="mt-11.5 flex flex-col gap-3 text-brand-dark-green md:mt-[108.5px]">
              <h2 className="text-h4-sans md:w-84">
                <span className="md:hidden">{mobileTitle}</span>
                <span className="hidden md:inline">{data.title}</span>
              </h2>
              {mobileDescription ? (
                <p className="text-mono-s md:hidden">{mobileDescription}</p>
              ) : null}
              {data.description ? (
                <p className="text-mono-s hidden md:block md:w-121.25">
                  {data.description}
                </p>
              ) : null}
            </div>
          </Reveal>

          <Reveal
            amount={0.2}
            className={reverse ? 'md:col-start-1 md:row-start-1' : ''}
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

      <MessagingFeaturePanel data={lmn} image={<LmnImage />} />
      <MessagingFeaturePanel
        data={censorship}
        image={<PrivacyImage />}
        reverse
      />
    </>
  )
}
