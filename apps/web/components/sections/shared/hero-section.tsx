'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

import type { HeroSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

interface HeroSectionViewProps {
  data: HeroSection
  /**
   * Backdrop rendered behind the hero copy. Defaults to the Logos background
   * video used on the homepage; pages with a still backdrop (e.g.
   * /build-the-parallel) pass their own `<Image>` instead.
   */
  background?: ReactNode
  /**
   * Stable Umami event names for the primary and secondary CTA, in that
   * order. Without them the global click tracker names the event after the
   * button's text, so a copy edit starts a new metric series.
   */
  ctaEventNames?: readonly [primary?: string, secondary?: string]
  /**
   * Below `lg` only. `offsets` (default) keeps the homepage's hand-placed
   * positions. `centred` stacks the blocks and centres them in the part of
   * the hero a phone can actually see — the section is a fixed 760px, which
   * is taller than most phone viewports, so hand-placed offsets that are
   * centred within 760px still read as bottom-heavy on screen.
   *
   * From `lg` up both options render the identical absolute layout.
   */
  mobileContentLayout?: 'offsets' | 'centred'
}

/**
 * Height the mobile content centres within. `svh` so browser chrome
 * appearing/disappearing does not shift the copy, capped well under the
 * hero's own 760px: phones report a viewport taller than the area they
 * actually paint, and centring in the full 760px leaves a visibly bigger gap
 * above the copy than below it. Floored so a landscape phone cannot clip it.
 */
const MOBILE_CENTRING_BOX = 'h-[100svh] max-h-[700px] min-h-[560px]'

const defaultBackground = (
  <video
    autoPlay
    muted
    loop
    playsInline
    poster="/images/home/hero-bg.webp"
    className="h-full w-full object-cover opacity-70"
  >
    <source src="/videos/home/logos-bg-vid.mp4" type="video/mp4" />
  </video>
)

export default function HeroSectionView({
  data,
  background = defaultBackground,
  ctaEventNames,
  mobileContentLayout = 'offsets',
}: HeroSectionViewProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.025])
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    [1, 0.35, 0.35]
  )

  const [primaryCta, secondaryCta] = data.ctas ?? []
  const [primaryEventName, secondaryEventName] = ctaEventNames ?? []
  const isMobileCentred = mobileContentLayout === 'centred'

  const headline = (
    <motion.h1
      className={
        isMobileCentred
          ? 'w-[280px] text-center font-display text-[56px] leading-[0.98] tracking-normal whitespace-pre-line lg:absolute lg:top-[282px] lg:left-1/2 lg:w-max lg:max-w-[calc(100vw-24px)] lg:-translate-x-1/2 lg:text-[96px] lg:tracking-[-0.04em]'
          : 'absolute top-[272px] left-1/2 w-[280px] -translate-x-1/2 text-center font-display text-[56px] leading-[0.98] tracking-normal whitespace-pre-line lg:top-[282px] lg:w-max lg:max-w-[calc(100vw-24px)] lg:text-[96px] lg:tracking-[-0.04em]'
      }
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.18 }}
    >
      <span className="lg:hidden">{data.headline}</span>
      <span className="hidden lg:inline">{data.headline}</span>
    </motion.h1>
  )

  const subheadAndCtas = (
    <motion.div
      className={
        isMobileCentred
          ? 'flex w-[274px] flex-col items-center gap-6 text-center lg:absolute lg:top-[454px] lg:left-[calc(50%+6px)] lg:w-[480px] lg:items-start lg:text-left'
          : 'absolute top-[462px] left-1/2 flex w-[274px] -translate-x-1/2 flex-col items-center gap-6 text-center lg:top-[454px] lg:left-[calc(50%+6px)] lg:w-[345px] lg:translate-x-0 lg:items-start lg:text-left'
      }
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
        delay: 0.55,
      }}
    >
      {data.bodySecondary ? (
        <p className="text-mono-s w-56.5 text-brand-off-white lg:w-full">
          <span className="lg:hidden">{data.bodySecondary}</span>
          <span className="hidden whitespace-pre-line lg:inline">
            {data.bodySecondary}
          </span>
        </p>
      ) : null}
      <div className="flex flex-col items-center gap-2 lg:flex-row">
        {primaryCta ? (
          <Button
            href={primaryCta.href}
            data-umami-event-name={primaryEventName}
            className="cursor-pointer bg-brand-off-white text-brand-dark-green transition-all hover:bg-transparent hover:text-brand-off-white"
          >
            {primaryCta.label}
          </Button>
        ) : null}
        {secondaryCta ? (
          <Button
            href={secondaryCta.href}
            variant="secondary"
            data-umami-event-name={secondaryEventName}
            className="cursor-pointer border-brand-off-white/50 text-brand-off-white backdrop-blur-sm transition-all hover:bg-brand-off-white hover:text-brand-dark-green"
          >
            {secondaryCta.label}
          </Button>
        ) : null}
      </div>
    </motion.div>
  )

  const body = data.body ? (
    <motion.p
      className={
        isMobileCentred
          ? 'text-mono-s w-[226px] text-center text-brand-off-white lg:absolute lg:top-[168px] lg:left-[calc(50%+6px)] lg:w-[345px] lg:text-left'
          : 'text-mono-s absolute top-[114px] left-1/2 w-[226px] -translate-x-1/2 text-center text-brand-off-white lg:top-[168px] lg:left-[calc(50%+6px)] lg:w-[345px] lg:translate-x-0 lg:text-left'
      }
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
        delay: 0.38,
      }}
    >
      <span className="lg:hidden">{data.body}</span>
      <span className="hidden lg:inline">{data.body}</span>
    </motion.p>
  ) : null

  if (isMobileCentred) {
    return (
      <section
        ref={sectionRef}
        className="relative z-[1] h-[760px] overflow-hidden bg-brand-dark-green"
      >
        {/* Background image */}
        <motion.div className="absolute inset-0" style={{ scale: bgScale }}>
          {background}
        </motion.div>

        {/* Content — centred on phones, hand-placed offsets from `lg` up. */}
        <motion.div
          className={`relative flex flex-col items-center justify-center gap-[72px] text-brand-off-white lg:block lg:h-full lg:max-h-none lg:min-h-0 ${MOBILE_CENTRING_BOX}`}
          style={{ opacity: contentOpacity }}
        >
          {body}
          {headline}
          {subheadAndCtas}
        </motion.div>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      className="relative z-[1] h-[760px] overflow-hidden bg-brand-dark-green"
    >
      {/* Background image */}
      <motion.div className="absolute inset-0" style={{ scale: bgScale }}>
        {background}
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative flex h-full flex-col text-brand-off-white"
        style={{ opacity: contentOpacity }}
      >
        {headline}
        {subheadAndCtas}
      </motion.div>

      {body}
    </section>
  )
}
