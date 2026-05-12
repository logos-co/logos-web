import Image from 'next/image'
import { LogosMark } from '@repo/ui'

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
  techStack: {
    disclaimer: string
    heading: string
    body: string
    cta: string
    cards: string[]
    networking: string
    foundation: string
    primaryCta: string
    secondaryCta: string
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
          className="grid min-h-[31px] grid-cols-2 border-t border-brand-dark-green/10 py-1.5 last:border-b"
        >
          <p className="text-mono-s">{row.label}</p>
          <p className="text-mono-s pr-2">{row.body}</p>
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
      <div className="relative z-10 mx-auto flex h-full max-w-[1416px] items-center justify-center">
        <div className="flex w-full -translate-y-[6px] flex-col items-center text-center">
          <div className="text-h4-serif mb-[60px] inline-flex items-center gap-3">
            <LogosMark size={20} />
            <span>{copy.label}</span>
          </div>
          <h1 className="font-display text-[56px] leading-[0.88] tracking-[-0.03em]">
            {headingLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="text-mono-s mt-[60px] w-[462px] max-w-full">
            {copy.body}
          </p>
          <div className="mt-[60px] flex gap-1">
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
      </div>
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
    <section className="grid h-[650px] grid-cols-2 gap-3 bg-brand-off-white p-3 text-brand-dark-green">
      <div className="flex flex-col justify-between">
        <div className="flex flex-col gap-20">
          <div>
            <h2 className="text-h4-serif mb-6">{copy.heading}</h2>
            <DataRows rows={copy.rows} />
          </div>
          <div>
            <h2 className="text-h4-serif mb-6">{evaluation.heading}</h2>
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
      <div className="relative overflow-hidden">
        <Image
          src="/images/lambda-prize/how-it-works.webp"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
        />
      </div>
    </section>
  )
}

function PrizeCard({ prize, image }: { prize: PrizeCopy; image: string }) {
  return (
    <article className="relative h-[551px] overflow-hidden text-brand-off-white">
      <Image src={image} alt="" fill sizes="33vw" className="object-cover" />
      <div className="absolute inset-0 bg-brand-dark-green/45" />
      <div className="relative z-10 flex h-full flex-col justify-between p-3">
        <div className="flex items-start justify-between">
          <div className="text-mono-s flex flex-col">
            {prize.meta.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          <span className="text-mono-s rounded-full bg-brand-off-white px-3 py-1.5 text-brand-dark-green">
            {prize.status}
          </span>
        </div>
        <div className="mx-auto flex w-[220px] flex-col items-center gap-6 text-center">
          <h3 className="text-h4-serif">{prize.title}</h3>
          <Button
            href={ROUTES.rfps}
            className="cursor-pointer bg-brand-off-white text-brand-dark-green"
          >
            View Prize
          </Button>
        </div>
        <p className="text-mono-s w-[220px]">{prize.body}</p>
      </div>
    </article>
  )
}

function FeaturedPrizes({ copy }: { copy: LambdaPrizePageCopy['featured'] }) {
  return (
    <section className="h-[1011px] bg-brand-off-white pt-[200px] text-brand-dark-green">
      <h2 className="text-h3-serif px-3">{copy.heading}</h2>
      <div className="mt-6 grid grid-cols-3 gap-3 px-3">
        {copy.prizes.map((prize, index) => (
          <PrizeCard
            key={`${prize.title}-${index}`}
            prize={prize}
            image={prizeImages[index % prizeImages.length]}
          />
        ))}
      </div>
    </section>
  )
}

function AboutProgramme({ copy }: { copy: LambdaPrizePageCopy['about'] }) {
  return (
    <section className="grid h-[600px] grid-cols-2 gap-3 bg-brand-off-white p-3 text-brand-dark-green">
      <div className="relative overflow-hidden">
        <Image
          src="/images/lambda-prize/about.webp"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <h2 className="text-h3-serif">{copy.heading}</h2>
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
        <p className="text-mono-s mx-auto w-[345px] text-center">{copy.body}</p>
        <DataRows rows={copy.rows} />
      </div>
    </section>
  )
}

function TechCard({ title }: { title: string }) {
  return (
    <div className="flex h-[196px] items-center justify-center rounded-3xl border border-brand-dark-green text-center md:h-[366px]">
      <div className="flex flex-col items-center gap-3">
        <LogosMark size={18} />
        <h3 className="text-subhead-sans">{title}</h3>
      </div>
    </div>
  )
}

function TechStack({ copy }: { copy: LambdaPrizePageCopy['techStack'] }) {
  const headingLines = copy.heading.split('\n')

  return (
    <section className="h-[1507px] bg-brand-off-white px-3 pt-3 text-brand-dark-green">
      <div className="flex items-start justify-between">
        <p className="text-mono-s w-[226px]">{copy.disclaimer}</p>
        <div className="flex gap-1">
          <Button href={ROUTES.technologyStack} className="cursor-pointer">
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
      <div className="mx-auto mt-[52px] flex w-[464px] flex-col items-center text-center">
        <h2 className="font-display text-[56px] leading-[0.88] tracking-[-0.03em]">
          {headingLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>
        <p className="text-mono-s mt-10 w-[359px]">{copy.body}</p>
        <div className="mt-6">
          <TertiaryCta href={ROUTES.technologyStack}>{copy.cta}</TertiaryCta>
        </div>
      </div>
      <div className="mt-[100px] flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-3">
          {copy.cards.map((card) => (
            <TechCard key={card} title={card} />
          ))}
        </div>
        <div className="flex h-[196px] items-center justify-center rounded-3xl border border-brand-dark-green">
          <h3 className="text-subhead-sans">{copy.networking}</h3>
        </div>
        <div className="flex h-[196px] items-center justify-center rounded-3xl border border-brand-dark-green">
          <h3 className="text-subhead-sans">{copy.foundation}</h3>
        </div>
      </div>
    </section>
  )
}

function Support({ copy }: { copy: LambdaPrizePageCopy['support'] }) {
  return (
    <section className="h-[421px] border-t border-brand-dark-green/10 bg-brand-off-white pt-10 text-brand-dark-green">
      <div className="grid grid-cols-3 px-3">
        <h2 className="text-h3-serif">{copy.heading}</h2>
        <p className="text-mono-s w-[226px]">{copy.body}</p>
        <div>
          <TertiaryCta href={ROUTES.faq}>{copy.cta}</TertiaryCta>
        </div>
      </div>
      <div className="mt-[91px]">
        {copy.rows.map((row, index) => (
          <div
            key={row.label}
            className={`grid h-[50px] grid-cols-[714px_464px_1fr] px-3 py-3 ${
              index % 2 === 0 ? 'bg-gray-01' : 'bg-brand-dark-green/5'
            }`}
          >
            <div className="flex gap-3">
              <p className="text-body-sans w-[18px] font-medium">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="text-body-serif">{row.label}</h3>
            </div>
            <p className="text-mono-s w-[312px]">{row.body}</p>
            <TertiaryCta href={ROUTES.faq}>{row.action}</TertiaryCta>
          </div>
        ))}
      </div>
    </section>
  )
}

export function LambdaPrizePage({ copy }: LambdaPrizePageProps) {
  return (
    <main className="bg-brand-off-white">
      <Hero copy={copy.hero} />
      <HowItWorks copy={copy.howItWorks} evaluation={copy.evaluation} />
      <FeaturedPrizes copy={copy.featured} />
      <AboutProgramme copy={copy.about} />
      <TechStack copy={copy.techStack} />
      <Support copy={copy.support} />
    </main>
  )
}
