'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { useTranslations } from 'next-intl'

import type { HeroSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

type Props = {
  data: HeroSection
}

export default function HeroSectionView({ data }: Props) {
  const t = useTranslations('home.hero')
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.025])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.35])

  const [primaryCta, secondaryCta] = data.ctas ?? []

  return (
    <section
      ref={sectionRef}
      className="relative z-[1] h-[800px] overflow-hidden bg-brand-dark-green"
    >
      {/* Background image */}
      <motion.div className="absolute inset-0" style={{ scale: bgScale }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/images/home/hero-bg.jpg"
          className="h-full w-full object-cover opacity-70"
        >
          <source src="/videos/home/logos-bg-vid.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative flex h-full flex-col text-brand-off-white"
        style={{ opacity: contentOpacity }}
      >
        <motion.h1
          className="text-h1 absolute top-[268px] left-1/2 w-[calc(100vw-24px)] max-w-[369px] -translate-x-1/2 text-center leading-[0.98] whitespace-pre-line md:top-[314px] md:w-[1178px] md:max-w-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.18 }}
        >
          <span className="md:hidden">{t('mobileHeadline')}</span>
          <span className="hidden md:inline">{data.headline}</span>
        </motion.h1>

        <motion.div
          className="absolute top-[389px] left-1/2 flex w-[274px] -translate-x-1/2 flex-col items-center gap-6 text-center min-[640px]:top-[454px] min-[640px]:left-[calc(50%+6px)] min-[640px]:w-[345px] min-[640px]:translate-x-0 min-[640px]:items-start min-[640px]:text-left"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.55,
          }}
        >
          <p className="text-mono-s w-56.5 text-brand-off-white md:w-full">
            {t('kicker')}
          </p>
          <div className="flex flex-col items-center gap-1.5 md:flex-row">
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
                className="cursor-pointer rounded-xl border-brand-off-white/50 text-brand-off-white backdrop-blur-sm transition-all hover:bg-brand-off-white hover:text-brand-dark-green"
              >
                {secondaryCta.label}
              </Button>
            ) : null}
          </div>
        </motion.div>
      </motion.div>

      {data.body ? (
        <motion.p
          className="text-mono-s absolute top-[138px] left-1/2 w-[226px] -translate-x-1/2 text-center text-brand-off-white min-[640px]:top-[192px] min-[640px]:left-[calc(50%+6px)] min-[640px]:w-[345px] min-[640px]:translate-x-0 min-[640px]:text-left"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.38,
          }}
        >
          <span className="min-[640px]:hidden">{t('mobileBody')}</span>
          <span className="hidden min-[640px]:inline">{data.body}</span>
        </motion.p>
      ) : null}
    </section>
  )
}
