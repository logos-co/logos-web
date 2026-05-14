'use client'

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { LogosMark } from '@repo/ui'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

interface TableRow {
  title: string
  desc: string
}

interface FeatureCardProps {
  eyebrow: string
  description: string
  cta: string
  ctaHref: string
  tableIndex: string
  tableName: string
  tableLabel: string
  rows: TableRow[]
  bgImage: string
  cardTopOffset: number
  bgImageClassName?: string
  hasBackdropBlur?: boolean
  priority?: boolean
}

function FeatureCard({
  eyebrow,
  description,
  cta,
  ctaHref,
  tableIndex,
  tableName,
  tableLabel,
  rows,
  bgImage,
  cardTopOffset,
  bgImageClassName = 'scale-110 object-cover',
  hasBackdropBlur,
  priority = false,
}: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(cardRef, { once: true, amount: 0.1 })

  return (
    <div ref={cardRef} className="sticky top-0 z-[1] h-180.75">
      <motion.div
        className="absolute left-0 h-93.25 w-full overflow-hidden rounded-3xl"
        style={{ top: cardTopOffset }}
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <Image
          src={bgImage}
          alt=""
          fill
          className={bgImageClassName}
          priority={priority}
        />
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 flex h-full w-full">
          {/* Left — eyebrow + description + CTA */}
          <div className="flex w-129.5 shrink-0 flex-col justify-between p-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2.5">
                <LogosMark
                  size={26}
                  className="shrink-0 text-brand-off-white"
                />
                <span className="text-h3-serif text-brand-off-white">
                  {eyebrow}
                </span>
              </div>
              <p className="w-80 text-[14px] leading-[1.2] font-medium text-brand-off-white">
                {description}
              </p>
            </div>
            <Button
              href={ctaHref}
              className="self-start bg-brand-off-white text-brand-dark-green transition-all hover:bg-transparent hover:text-brand-off-white"
            >
              {cta}
            </Button>
          </div>

          {/* Right — table (desktop only) */}
          <div
            className={`absolute top-3 left-178.5 hidden h-87.25 w-172.5 overflow-hidden rounded-xl md:block ${hasBackdropBlur ? 'backdrop-blur-[10px]' : ''}`}
          >
            <div className="flex gap-3 px-3 pt-3 text-eyebrow text-brand-off-white">
              <span className="w-23.75">{tableIndex}</span>
              {tableName && <span className="w-56.5">{tableName}</span>}
              <span>{tableLabel}</span>
            </div>
            <div className="mt-auto flex flex-col gap-3 px-3 pt-4">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className="flex gap-3 border-t border-brand-off-white/50 pt-1.5 text-brand-off-white"
                >
                  {row.title && (
                    <span className="text-eyebrow w-83.25 shrink-0">
                      {row.title}
                    </span>
                  )}
                  <span
                    className={`text-mono-s ${row.title ? 'flex-1' : 'w-83.25'}`}
                  >
                    {row.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function FeatureCardsSection() {
  const t = useTranslations('home')

  return (
    <section className="relative z-[5] -mt-80">
      <div className="pt-27">
        <div className="rounded-tl-[36px] rounded-tr-[36px] bg-brand-off-white pt-3">
          <div className="relative mx-auto max-w-354 px-3">
            <FeatureCard
              eyebrow={t('build.eyebrow')}
              description={t('build.description')}
              cta={t('build.cta')}
              ctaHref={ROUTES.buildersHub}
              tableIndex={t('build.number')}
              tableName={t('build.eyebrow').toLowerCase()}
              tableLabel={t('build.examples')}
              rows={[
                { title: t('build.row1Title'), desc: t('build.row1Desc') },
                { title: t('build.row2Title'), desc: t('build.row2Desc') },
                { title: t('build.row3Title'), desc: t('build.row3Desc') },
                { title: t('build.row4Title'), desc: t('build.row4Desc') },
              ]}
              bgImage="/images/home/build-bg.jpg"
              cardTopOffset={50}
              priority
            />

            <FeatureCard
              eyebrow={t('node.eyebrow')}
              description={t('node.description')}
              cta={t('node.cta')}
              ctaHref={ROUTES.nodeProgram}
              tableIndex={t('node.number')}
              tableName="Node"
              tableLabel={t('node.examples')}
              rows={[
                {
                  title: t('node.row1Title'),
                  desc: t('node.row1Desc'),
                },
                {
                  title: t('node.row2Title'),
                  desc: t('node.row2Desc'),
                },
                {
                  title: t('node.row3Title'),
                  desc: t('node.row3Desc'),
                },
                {
                  title: t('node.row4Title'),
                  desc: t('node.row4Desc'),
                },
              ]}
              bgImage="/images/home/node-card-bg.webp"
              cardTopOffset={200}
            />

            <FeatureCard
              eyebrow={t('circles.eyebrow')}
              description={t('circles.description')}
              cta={t('circles.cta')}
              ctaHref={ROUTES.circles}
              tableIndex={t('circles.number')}
              tableName=""
              tableLabel={t('circles.winnableIssues')}
              rows={[
                {
                  title: '',
                  desc: t('circles.issue1Desc'),
                },
                {
                  title: '',
                  desc: t('circles.issue2Desc'),
                },
                {
                  title: '',
                  desc: t('circles.issue3Desc'),
                },
                {
                  title: '',
                  desc: t('circles.issue4Desc'),
                },
                {
                  title: '',
                  desc: t('circles.issue5Desc'),
                },
              ]}
              bgImage="/images/home/circles-card-bg.webp"
              bgImageClassName="object-cover object-[50%_78%]"
              cardTopOffset={350}
              hasBackdropBlur
            />
          </div>
        </div>
      </div>
    </section>
  )
}
