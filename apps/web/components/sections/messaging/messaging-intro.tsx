import Image from 'next/image'
import type { ReactNode } from 'react'

import { TechTextSplitSection } from '@acid-info/logos-ui'
import type { CtaPanelSection } from '@repo/content/schemas'

import { Reveal } from '@/components/motion/reveal'

import { SectionMarker } from './messaging-shared'

function LmnImage() {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-gray-02 md:h-144 md:w-175.5">
      <Image
        src="/images/messaging/lmn.webp"
        alt=""
        width={746}
        height={933}
        sizes="(min-width: 768px) 702px, 369px"
        className="absolute top-[-93px] left-[-28px] h-[497px] w-[397px] max-w-none object-cover md:top-[-167px] md:h-[933px] md:w-[746px]"
      />
    </div>
  )
}

function PrivacyImage() {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-gray-02 md:h-144 md:w-175.5">
      <Image
        src="/images/messaging/privacy.webp"
        alt=""
        width={746}
        height={933}
        sizes="(min-width: 768px) 702px, 369px"
        className="absolute top-[-25px] left-[-38px] h-[461px] w-[461px] max-w-none object-cover md:top-[-47px] md:left-[-77px] md:h-[838px] md:w-[838px]"
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
  return (
    <section className="bg-gray-01">
      <div
        className={`relative mx-auto h-150 max-w-360 p-3 md:flex md:items-start md:justify-between ${
          reverse ? 'md:flex-row-reverse' : 'md:flex-row'
        }`}
      >
        <Reveal className="flex h-72 flex-col md:h-144 md:w-175.5">
          {data.eyebrow ? <SectionMarker label={data.eyebrow} /> : null}

          <div className="mt-11.5 flex flex-col gap-3 text-brand-dark-green md:mt-auto">
            <h2 className="text-h4-sans md:w-84">{data.title}</h2>
            {data.description ? (
              <p className="text-mono-s md:w-121.25">{data.description}</p>
            ) : null}
          </div>
        </Reveal>

        <Reveal amount={0.2}>{image}</Reveal>
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
          className="mb-15 md:mb-0"
          title={privacy.title}
          body={
            privacy.description
              ? privacy.description
                  .split('\n\n')
                  .map((paragraph) => <p key={paragraph}>{paragraph}</p>)
              : null
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
