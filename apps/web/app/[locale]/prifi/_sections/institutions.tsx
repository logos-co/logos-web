import Image from 'next/image'
import type { PrifiCopySection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'

import { BODY_18, TRIM } from './atoms'

type InstitutionsCopy = PrifiCopySection['institutions']

/** Figma's off-white fade down from the top of the photo. */
const TOP_FADE =
  'linear-gradient(180deg, #f5f5ef 0%, rgba(245, 245, 239, 0) 33.482%)'

/** Figma's off-white fade in from the top left, which carries the copy. */
const CORNER_FADE =
  'linear-gradient(142.07deg, #f5f5ef 22.922%, rgba(245, 245, 239, 0) 78.151%)'

/**
 * On desktop the copy sits on the photo, as in Figma. Narrow screens have no
 * room for that without covering the climber, so the photo drops below.
 */
export function Institutions({ copy }: { copy: InstitutionsCopy }) {
  return (
    <section className="relative isolate flex flex-col overflow-hidden bg-brand-off-white text-brand-dark-green lg:h-[672px] lg:justify-center lg:py-[60px]">
      <div className="relative order-last aspect-[4/3] w-full md:aspect-[2/1] lg:absolute lg:inset-0 lg:-z-10 lg:aspect-auto">
        <Image
          src="/images/prifi/institutions.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[80%_50%]"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundImage: TOP_FADE }}
        />
        <div
          aria-hidden
          className="absolute inset-0 hidden lg:block"
          style={{ backgroundImage: CORNER_FADE }}
        />
      </div>
      <ContentWidth className="w-full">
        <div className="flex max-w-[818px] flex-col gap-6 pt-16 pb-6 lg:p-0">
          <h2 className={`text-h3-serif ${TRIM}`}>{copy.heading}</h2>
          <div className={BODY_18}>
            <p>{copy.body[0]}</p>
            <p className="mt-[1.2em]">{copy.body[1]}</p>
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}
