import Image from 'next/image'
import { LogosMark } from '@acid-info/logos-ui'
import type { TechStackOverviewSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import TechStackSection from '@/components/sections/home/tech-stack-section'
import { Button, ButtonArrowIcon } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { Link } from '@/i18n/navigation'

interface RowCopy {
  label: string
  body: string
}

interface PrizeCopy {
  meta: string[]
  title: string
  body: string
  status: string
}

interface SupportRowCopy extends RowCopy {
  action: string
}

interface LambdaPrizePageCopy {
  hero: {
    label: string
    heading: string
    body: string
    primaryCta: string
    secondaryCta: string
  }
  howItWorks: {
    heading: string
    rows: RowCopy[]
  }
  evaluation: {
    heading: string
    rows: RowCopy[]
    primaryCta: string
    secondaryCta: string
  }
  featured: {
    heading: string
    prizes: PrizeCopy[]
  }
  about: {
    heading: string
    body: string
    primaryCta: string
    secondaryCta: string
    rows: RowCopy[]
  }
  support: {
    heading: string
    body: string
    cta: string
    rows: SupportRowCopy[]
  }
}

interface LambdaPrizePageProps {
  copy: LambdaPrizePageCopy
  techStack: TechStackOverviewSection
}

const prizeImages = [
  '/images/lambda-prize/prize-1.webp',
  '/images/lambda-prize/prize-2.webp',
  '/images/lambda-prize/prize-3.webp',
]

function TertiaryCta({
  href,
  children,
  tone = 'dark',
}: {
  href: string
  children: string
  tone?: 'dark' | 'light'
}) {
  return (
    <Link
      href={href}
      className={`inline-flex cursor-pointer items-center gap-1 border-b pb-0.5 font-mono text-[10px] font-semibold uppercase leading-[1.35] ${
        tone === 'light'
          ? 'border-brand-off-white/50 text-brand-off-white'
          : 'border-brand-dark-green/50 text-brand-dark-green'
      }`}
    >
      {children}
      <ButtonArrowIcon />
    </Link>
  )
}

function DataRows({ rows }: { rows: RowCopy[] }) {
  return (
    <div className="flex flex-col">
      {rows.map((row, index) => (
        <div
          key={`${row.label}-${index}`}
          className="flex min-h-[36px] min-w-0 flex-col border-t border-brand-dark-green/10 py-3 last:border-b lg:grid lg:min-h-[31px] lg:grid-cols-2"
        >
          <p className="text-mono-s">{row.label}</p>
          <p className="text-mono-s min-w-0 pr-2 break-words [overflow-wrap:anywhere]">
            {row.body}
          </p>
        </div>
      ))}
    </div>
  )
}

function Hero({ copy }: { copy: LambdaPrizePageCopy['hero'] }) {
  const headingLines = copy.heading.split('\n')

  return (
    <section className="relative h-[800px] overflow-hidden bg-brand-dark-green px-3 pt-10 text-brand-off-white">
      <Image
        src="/images/lambda-prize/hero.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover blur-[2px] grayscale"
        priority
      />
      <div className="absolute inset-0 bg-brand-dark-green/35" />
      <ContentWidth className="relative z-10 flex h-full items-center justify-center">
        <div className="flex w-full -translate-y-[6px] flex-col items-center text-center">
          <div className="text-h4-serif mb-12 inline-flex items-center gap-3">
            <LogosMark size={20} />
            <span>{copy.label}</span>
          </div>
          <h1 className="w-full max-w-[369px] font-display text-[40px] leading-none tracking-[-0.03em] lg:max-w-none lg:text-[56px] lg:leading-[0.88]">
            {headingLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="text-mono-s mt-12 w-full max-w-[345px] lg:w-[462px] lg:max-w-full">
            <span className="inline-flex items-baseline gap-1">
              <LogosMark size={7} className="shrink-0" />
              <span>{copy.body}</span>
            </span>
          </p>
          <div className="mt-15 flex gap-1">
            <Button
              href={ROUTES.rfps}
              className="cursor-pointer bg-brand-off-white text-brand-dark-green"
            >
              {copy.primaryCta}
            </Button>
            <Button
              href={ROUTES.buildersHub}
              variant="secondary"
              className="cursor-pointer border-brand-off-white/50 text-brand-off-white"
            >
              {copy.secondaryCta}
            </Button>
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}

function HowItWorks({
  copy,
  evaluation,
}: {
  copy: LambdaPrizePageCopy['howItWorks']
  evaluation: LambdaPrizePageCopy['evaluation']
}) {
  return (
    <section className="bg-brand-off-white text-brand-dark-green">
      <ContentWidth className="flex flex-col gap-4 p-3 lg:grid lg:h-[650px] lg:grid-cols-2 lg:gap-6 lg:px-3 lg:py-10">
        <div className="order-2 flex min-h-[687px] flex-col justify-between lg:order-1 lg:min-h-0">
          <div className="flex flex-col gap-10 lg:gap-20">
            <div>
              <h2 className="text-h4-serif mb-8">{copy.heading}</h2>
              <DataRows rows={copy.rows} />
            </div>
            <div>
              <h2 className="text-h4-serif mb-8">{evaluation.heading}</h2>
              <DataRows rows={evaluation.rows} />
            </div>
          </div>
          <div className="flex gap-1">
            <Button href={ROUTES.rfps} className="cursor-pointer">
              {evaluation.primaryCta}
            </Button>
            <Button
              href={ROUTES.buildersHub}
              variant="secondary"
              className="cursor-pointer"
            >
              {evaluation.secondaryCta}
            </Button>
          </div>
        </div>
        <div className="relative order-1 h-[626px] overflow-hidden lg:order-2 lg:h-auto">
          <Image
            src="/images/lambda-prize/how-it-works.webp"
            alt=""
            fill
            sizes="50vw"
            className="rounded-xl object-cover object-left lg:object-center"
          />
        </div>
      </ContentWidth>
    </section>
  )
}

function PrizeCard({ prize, image }: { prize: PrizeCopy; image: string }) {
  return (
    <article className="relative h-[551px] overflow-hidden rounded-xl text-brand-off-white">
      <Image
        src={image}
        alt=""
        fill
        sizes="33vw"
        className="scale-105 object-cover blur-[6px]"
      />
      <div className="absolute inset-0 bg-brand-dark-green/35" />
      <div className="relative z-10 flex h-full flex-col justify-between p-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="text-mono-s flex flex-col">
            {prize.meta.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          <span className="text-mono-s shrink-0 rounded-[4px] bg-[#c8f1ff] px-6 py-2 text-brand-dark-green">
            {prize.status}
          </span>
        </div>
        <div className="mx-auto flex w-[220px] flex-col items-center gap-6 text-center">
          <h3 className="text-h4-serif">{prize.title}</h3>
          <Button
            href={ROUTES.rfps}
            className="cursor-pointer bg-brand-off-white text-brand-dark-green"
          >
            Learn More
          </Button>
        </div>
        <p className="text-mono-s w-[276px] max-w-full">{prize.body}</p>
      </div>
    </article>
  )
}

function FeaturedPrizes({ copy }: { copy: LambdaPrizePageCopy['featured'] }) {
  return (
    <section className="h-[1931px] bg-brand-off-white px-3 pt-10 text-brand-dark-green lg:h-[1011px] lg:px-3 lg:pt-12">
      <ContentWidth>
        <h2 className="text-h3-serif">{copy.heading}</h2>
        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:mt-12">
          {copy.prizes.map((prize, index) => (
            <PrizeCard
              key={`${prize.title}-${index}`}
              prize={prize}
              image={prizeImages[index % prizeImages.length]}
            />
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}

function AboutProgramme({ copy }: { copy: LambdaPrizePageCopy['about'] }) {
  return (
    <section className="bg-gray-01 text-brand-dark-green">
      <ContentWidth className="flex min-h-[960px] flex-col gap-3 p-3 lg:h-[600px] lg:min-h-0 lg:flex-row">
        <div className="relative h-[405px] overflow-hidden rounded-3xl lg:h-full lg:w-[702px] lg:shrink-0">
          <Image
            src="/images/lambda-prize/about.webp"
            alt=""
            fill
            sizes="(min-width: 768px) 702px, 100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="flex min-h-[519px] min-w-0 flex-1 flex-col justify-between lg:h-full lg:min-h-0">
          <div className="flex flex-col items-start justify-between gap-3 lg:h-9 lg:flex-row lg:gap-0">
            <h2 className="text-h3-sans whitespace-nowrap">{copy.heading}</h2>
            <div className="flex gap-1">
              <Button href={ROUTES.rfps} className="cursor-pointer">
                {copy.primaryCta}
              </Button>
              <Button
                href={ROUTES.buildersHub}
                variant="secondary"
                className="cursor-pointer"
              >
                {copy.secondaryCta}
              </Button>
            </div>
          </div>
          <p className="mx-auto w-full max-w-[345px] text-center font-sans text-[12px] leading-[1.2] font-medium text-brand-dark-green">
            {copy.body}
          </p>
          <div className="flex flex-col gap-3 text-brand-dark-green">
            {copy.rows.map((row, index) => (
              <div
                key={`${row.label}-${index}`}
                className="flex min-w-0 flex-col gap-1.5 border-t border-brand-dark-green/50 pt-1.5 lg:flex-row lg:gap-3"
              >
                <p className="text-eyebrow min-w-0 uppercase lg:w-[345px] lg:shrink-0">
                  {row.label}
                </p>
                <p className="text-mono-s min-w-0 break-words [overflow-wrap:anywhere]">
                  {row.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}

function Support({ copy }: { copy: LambdaPrizePageCopy['support'] }) {
  return (
    <section className="h-[406px] border-t border-brand-dark-green/10 bg-brand-off-white px-3 py-10 text-brand-dark-green lg:h-[421px] lg:py-12">
      <ContentWidth>
        <div className="grid grid-cols-[1fr_auto] gap-y-6 lg:grid-cols-3">
          <h2 className="text-h3-serif">{copy.heading}</h2>
          <p className="text-mono-s col-start-1 row-start-2 w-[178px] lg:col-start-auto lg:row-start-auto lg:w-[226px]">
            {copy.body}
          </p>
          <div className="col-start-2 row-start-1 lg:col-start-auto lg:row-start-auto">
            <TertiaryCta href={ROUTES.faq}>{copy.cta}</TertiaryCta>
          </div>
        </div>
        <div className="mt-6 lg:mt-8">
          {copy.rows.map((row, index) => (
            <div
              key={row.label}
              className={`grid h-[58px] grid-cols-[1fr_83px] items-start px-3 py-3 lg:h-[50px] lg:grid-cols-[714px_464px_1fr] ${
                index % 2 === 0 ? 'bg-gray-01' : 'bg-brand-dark-green/5'
              }`}
            >
              <div className="flex gap-3">
                <p className="text-body-sans w-[18px] font-medium">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="text-body-serif">{row.label}</h3>
              </div>
              <p className="text-mono-s hidden w-[312px] lg:block">
                {row.body}
              </p>
              <TertiaryCta href={ROUTES.faq}>{row.action}</TertiaryCta>
            </div>
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}

export function LambdaPrizePage({ copy, techStack }: LambdaPrizePageProps) {
  return (
    <main className="overflow-hidden bg-brand-off-white">
      <Hero copy={copy.hero} />
      <HowItWorks copy={copy.howItWorks} evaluation={copy.evaluation} />
      <FeaturedPrizes copy={copy.featured} />
      <AboutProgramme copy={copy.about} />
      <TechStackSection
        data={techStack}
        networkingHref={ROUTES.networking}
        foundationHref={ROUTES.technologyStack}
        desktopAt1025
      />
      <Support copy={copy.support} />
    </main>
  )
}
