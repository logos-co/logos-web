import type { ReactNode } from 'react'
import Image from 'next/image'

import type { HomeBuilderPortalSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { SectionHeadingReveal } from '@/components/motion/section-heading-reveal'
import { Button, ButtonArrowIcon } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

// Temporarily hidden — Basecamp feature boxes (chat / node / transactions).
// Keep this so we can re-enable the feature row below later.
// interface BasecampFeatureProps {
//   label: string
//   image: string
//   imageClassName?: string
// }
//
// function BasecampFeature({
//   label,
//   image,
//   imageClassName,
// }: BasecampFeatureProps) {
//   return (
//     <div className="relative flex h-[55px] items-center justify-center overflow-hidden rounded-xl border border-brand-dark-green/50 font-sans text-[18px] leading-[1.15] tracking-[-0.01em] text-brand-dark-green lg:h-[189px]">
//       <Image
//         src={image}
//         alt=""
//         fill
//         sizes="(max-width: 768px) 369px, 464px"
//         className={`object-cover blur-[20px] lg:hidden ${imageClassName ?? ''}`}
//       />
//       <div className="absolute inset-0 bg-black/20 lg:hidden" />
//       <span className="relative z-[1] text-brand-off-white lg:text-brand-dark-green">
//         {label}
//       </span>
//     </div>
//   )
// }

export default function BuilderPortalSection({
  data,
}: {
  data: HomeBuilderPortalSection
}) {
  return (
    <BuilderPortalLayout
      heading={
        <SectionHeadingReveal
          className="text-h2 desktop:w-[702px] relative z-[1] max-w-[702px] whitespace-pre-line text-brand-dark-green"
          delay={0.08}
        >
          {data.title}
        </SectionHeadingReveal>
      }
      action={
        <Button
          href={ROUTES.basecamp}
          variant="secondary"
          icon={<ButtonArrowIcon />}
          className="w-fit cursor-pointer transition-opacity hover:opacity-80"
        >
          {data.cta}
        </Button>
      }
      description={
        <p className="text-mono-s desktop:w-[345px] whitespace-pre-line text-brand-dark-green">
          {data.description}
        </p>
      }
    />
  )
}

interface BuilderPortalLayoutProps {
  id?: string
  heading: ReactNode
  action?: ReactNode
  /** Pinned to the bottom of the copy column on desktop. */
  description?: ReactNode
  /** Replaces the Basecamp screenshot inside the 940×532 panel. */
  media?: ReactNode
  /** The class props below replace the defaults outright. */
  className?: string
  contentClassName?: string
  columnClassName?: string
}

/**
 * Copy column beside the 940×532 Basecamp panel. Exported so campaign pages
 * can reuse the block with their own heading and copy.
 */
export function BuilderPortalLayout({
  id,
  heading,
  action,
  description,
  media,
  className = 'border-t border-brand-dark-green/10 bg-brand-off-white',
  contentClassName = 'desktop:pt-28 py-25 lg:pb-0',
  columnClassName = 'desktop:min-h-[532px] desktop:justify-between desktop:gap-0 flex flex-col gap-10',
}: BuilderPortalLayoutProps) {
  return (
    <section id={id} className={className}>
      <ContentWidth className={contentClassName}>
        <div className="desktop:grid-cols-3 desktop:gap-3 grid gap-9">
          <div className={columnClassName}>
            <div className="flex flex-col gap-7.5">
              {heading}
              {action}
            </div>

            {description}
          </div>

          <div className="desktop:col-span-2 desktop:aspect-auto desktop:h-[532px] relative aspect-[2820/1596] overflow-hidden rounded-3xl bg-[#1c1c1c] min-[768px]:max-desktop:aspect-[2820/1064]">
            {media ?? (
              <Image
                src="/images/home/figma-refresh/basecamp.webp"
                alt=""
                fill
                sizes="(max-width: 1024px) calc(100vw - 24px), (max-width: 1440px) calc(66.67vw - 20px), 940px"
                className="object-cover object-top"
              />
            )}
          </div>
        </div>

        {/* Temporarily hidden — re-enable to show the Basecamp feature boxes.
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <BasecampFeature
            label={data.featureChat}
            image="/images/home/figma-refresh/basecamp-chat.webp"
            imageClassName="rotate-90 scale-125"
          />
          <BasecampFeature
            label={data.featureNode}
            image="/images/home/figma-refresh/basecamp-node.webp"
            imageClassName="scale-125"
          />
          <BasecampFeature
            label={data.featureTransactions}
            image="/images/home/figma-refresh/basecamp-transactions.webp"
            imageClassName="scale-125"
          />
        </div>
        */}
      </ContentWidth>
    </section>
  )
}
