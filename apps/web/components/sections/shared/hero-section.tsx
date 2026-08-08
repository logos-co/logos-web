'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

import type { HeroSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

/**
 * `offsets` keeps the homepage's hand-placed absolute positions.
 * `centred` stacks the same three blocks in a flex column centred in the hero,
 * so the group stays vertically centred at any viewport and whatever length
 * the copy wraps to.
 */
type HeroContentLayout = 'offsets' | 'centred'

interface HeroSectionViewProps {
  data: HeroSection
  /**
   * Backdrop rendered behind the hero copy. Defaults to the Logos background
   * video used on the homepage; pages with a still backdrop (e.g.
   * /build-the-parallel) pass their own `<Image>` instead.
   */
  background?: ReactNode
  contentLayout?: HeroContentLayout
}

const EASE = [0.25, 0.1, 0.25, 1] as const

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

/**
 * In the centred layout each block is a full-width row so the copy column can
 * be pinned to the same 50%+6px gridline the headline is centred on, instead
 * of being pulled around by the column's `items-center`.
 */
function CentredRow({ children }: { children: ReactNode }) {
  return <div className="w-full">{children}</div>
}

export default function HeroSectionView({
  data,
  background = defaultBackground,
  contentLayout = 'offsets',
}: HeroSectionViewProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.025])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.35])

  const [primaryCta, secondaryCta] = data.ctas ?? []
  const isCentred = contentLayout === 'centred'

  const headline = (
    <motion.h1
      className={
        isCentred
          ? 'w-[280px] text-center font-display text-[56px] leading-[0.98] tracking-normal whitespace-pre-line lg:w-max lg:max-w-[calc(100vw-24px)] lg:text-[96px] lg:tracking-[-0.04em]'
          : 'absolute top-[272px] left-1/2 w-[280px] -translate-x-1/2 text-center font-display text-[56px] leading-[0.98] tracking-normal whitespace-pre-line lg:top-[282px] lg:w-max lg:max-w-[calc(100vw-24px)] lg:text-[96px] lg:tracking-[-0.04em]'
      }
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: EASE, delay: 0.18 }}
    >
      <span className="lg:hidden">{data.headline}</span>
      <span className="hidden lg:inline">{data.headline}</span>
    </motion.h1>
  )

  const subheadAndCtas = (
    <motion.div
      className={
        isCentred
          ? 'mx-auto flex w-[274px] flex-col items-center gap-6 text-center lg:mx-0 lg:ml-[calc(50%+6px)] lg:w-[345px] lg:items-start lg:text-left'
          : 'absolute top-[462px] left-1/2 flex w-[274px] -translate-x-1/2 flex-col items-center gap-6 text-center lg:top-[454px] lg:left-[calc(50%+6px)] lg:w-[345px] lg:translate-x-0 lg:items-start lg:text-left'
      }
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
    >
      {data.bodySecondary ? (
        <p className="text-mono-s w-56.5 text-brand-off-white lg:w-full">
          {data.bodySecondary}
        </p>
      ) : null}
      <div className="flex flex-col items-center gap-2 lg:flex-row">
        {primaryCta ? (
          <Button
            href={primaryCta.href}
            className="cursor-pointer bg-brand-off-white text-brand-dark-green transition-all hover:bg-transparent hover:text-brand-off-white"
          >
            {primaryCta.label}
          </Button>
        ) : null}
        {secondaryCta ? (
          <Button
            href={secondaryCta.href}
            variant="secondary"
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
        isCentred
          ? 'text-mono-s mx-auto w-[226px] text-center text-brand-off-white lg:mx-0 lg:ml-[calc(50%+6px)] lg:w-[345px] lg:text-left'
          : 'text-mono-s absolute top-[114px] left-1/2 w-[226px] -translate-x-1/2 text-center text-brand-off-white lg:top-[168px] lg:left-[calc(50%+6px)] lg:w-[345px] lg:translate-x-0 lg:text-left'
      }
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.38 }}
    >
      <span className="lg:hidden">{data.body}</span>
      <span className="hidden lg:inline">{data.body}</span>
    </motion.p>
  ) : null

  return (
    <section
      ref={sectionRef}
      className="relative z-[1] h-[760px] overflow-hidden bg-brand-dark-green"
    >
      {/* Background image */}
      <motion.div className="absolute inset-0" style={{ scale: bgScale }}>
        {background}
      </motion.div>

      {/* Content — Figma stacks the three blocks with an even 70px rhythm. */}
      {isCentred ? (
        <motion.div
          className="relative flex h-full flex-col items-center justify-center gap-[70px] px-3 text-brand-off-white"
          style={{ opacity: contentOpacity }}
        >
          {body ? <CentredRow>{body}</CentredRow> : null}
          {headline}
          <CentredRow>{subheadAndCtas}</CentredRow>
        </motion.div>
      ) : (
        <>
          <motion.div
            className="relative flex h-full flex-col text-brand-off-white"
            style={{ opacity: contentOpacity }}
          >
            {headline}
            {subheadAndCtas}
          </motion.div>
          {body}
        </>
      )}
    </section>
  )
}
