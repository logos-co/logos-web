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
          className="flex min-h-[36px] min-w-0 flex-col border-t border-brand-dark-green/10 py-1.5 last:border-b md:grid md:min-h-[31px] md:grid-cols-2"
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
      <div className="relative z-10 mx-auto flex h-full max-w-[1416px] items-center justify-center">
        <div className="flex w-full -translate-y-[6px] flex-col items-center text-center">
          <div className="text-h4-serif mb-[60px] inline-flex items-center gap-3">
            <LogosMark size={20} />
            <span>{copy.label}</span>
          </div>
          <h1 className="w-full max-w-[369px] font-display text-[40px] leading-none tracking-[-0.03em] md:max-w-none md:text-[56px] md:leading-[0.88]">
            {headingLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="text-mono-s mt-[60px] w-full max-w-[345px] md:w-[462px] md:max-w-full">
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
    <section className="flex flex-col gap-3 bg-brand-off-white p-3 text-brand-dark-green md:grid md:h-[650px] md:grid-cols-2">
      <div className="order-2 flex min-h-[687px] flex-col justify-between md:order-1 md:min-h-0">
        <div className="flex flex-col gap-10 md:gap-20">
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
      <div className="relative order-1 h-[626px] overflow-hidden md:order-2 md:h-auto">
        <Image
          src="/images/lambda-prize/how-it-works.webp"
          alt=""
          fill
          sizes="50vw"
          className="object-cover object-left md:object-center"
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
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="text-mono-s flex flex-col">
            {prize.meta.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          <span className="text-mono-s shrink-0 rounded-full bg-brand-off-white px-3 py-1.5 text-brand-dark-green">
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
    <section className="h-[1931px] bg-brand-off-white pt-[100px] text-brand-dark-green md:h-[1011px] md:pt-[200px]">
      <h2 className="text-h3-serif px-3">{copy.heading}</h2>
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3 md:px-3">
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
    <section className="flex h-[960px] flex-col gap-3 bg-brand-off-white p-3 text-brand-dark-green md:grid md:h-[600px] md:grid-cols-2">
      <div className="relative h-[405px] overflow-hidden md:h-auto">
        <Image
          src="/images/lambda-prize/about.webp"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
        />
      </div>
      <div className="flex min-h-[519px] flex-col justify-between md:min-h-0">
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:gap-0">
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
    <div className="flex h-[258px] items-center justify-center rounded-3xl border border-brand-dark-green text-center md:h-[366px]">
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
    <section className="mt-[100px] h-[1506px] bg-brand-off-white px-3 pt-3 text-brand-dark-green md:mt-0 md:h-[1507px]">
      <div className="flex items-start justify-between">
        <p className="text-mono-s w-[226px]">{copy.disclaimer}</p>
        <div className="flex flex-col gap-1 md:flex-row">
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
      <div className="mx-auto mt-[70px] flex w-full max-w-[464px] flex-col items-center text-center md:mt-[52px]">
        <h2 className="font-display text-[40px] leading-none tracking-[-0.03em] md:text-[56px] md:leading-[0.88]">
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {copy.cards.map((card) => (
            <TechCard key={card} title={card} />
          ))}
        </div>
        <div className="flex h-[196px] items-center justify-center rounded-3xl border border-brand-dark-green">
          <h3 className="text-subhead-sans w-[320px] max-w-full px-3 text-center whitespace-normal">
            {copy.networking}
          </h3>
        </div>
        <div className="flex h-[196px] items-center justify-center rounded-3xl border border-brand-dark-green">
          <h3 className="text-subhead-sans w-[320px] max-w-full px-3 text-center whitespace-normal">
            {copy.foundation}
          </h3>
        </div>
      </div>
    </section>
  )
}

function Support({ copy }: { copy: LambdaPrizePageCopy['support'] }) {
  return (
    <section className="h-[406px] border-t border-brand-dark-green/10 bg-brand-off-white pt-10 text-brand-dark-green md:h-[421px]">
      <div className="grid grid-cols-[1fr_auto] gap-y-6 px-3 md:grid-cols-3">
        <h2 className="text-h3-serif">{copy.heading}</h2>
        <p className="text-mono-s col-start-1 row-start-2 w-[178px] md:col-start-auto md:row-start-auto md:w-[226px]">
          {copy.body}
        </p>
        <div className="col-start-2 row-start-1 md:col-start-auto md:row-start-auto">
          <TertiaryCta href={ROUTES.faq}>{copy.cta}</TertiaryCta>
        </div>
      </div>
      <div className="mt-[35px] md:mt-[91px]">
        {copy.rows.map((row, index) => (
          <div
            key={row.label}
            className={`grid h-[58px] grid-cols-[1fr_83px] items-start px-3 py-3 md:h-[50px] md:grid-cols-[714px_464px_1fr] ${
              index % 2 === 0 ? 'bg-gray-01' : 'bg-brand-dark-green/5'
            }`}
          >
            <div className="flex gap-3">
              <p className="text-body-sans w-[18px] font-medium">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="text-body-serif">{row.label}</h3>
            </div>
            <p className="text-mono-s hidden w-[312px] md:block">{row.body}</p>
            <TertiaryCta href={ROUTES.faq}>{row.action}</TertiaryCta>
          </div>
        ))}
      </div>
    </section>
  )
}

export function LambdaPrizePage({ copy }: LambdaPrizePageProps) {
  return (
    <main className="overflow-hidden bg-brand-off-white">
      <Hero copy={copy.hero} />
      <HowItWorks copy={copy.howItWorks} evaluation={copy.evaluation} />
      <FeaturedPrizes copy={copy.featured} />
      <AboutProgramme copy={copy.about} />
      <TechStack copy={copy.techStack} />
      <Support copy={copy.support} />
    </main>
  )
}
