import Image from 'next/image'

import type {
  CardGridSection,
  CtaPanelSection,
  CTA,
  FeaturedTextSection,
  HeroSection,
  TableSection,
} from '@repo/content/schemas'
import { LogosMark } from '@acid-info/logos-ui'

import { IconMask } from '@/components/icons/icon-mask'
import { Button } from '@/components/ui'

interface BasecampPageProps {
  hero: HeroSection
  howItWorks: TableSection
  localFirst: CtaPanelSection
  modular: FeaturedTextSection
  capabilities: CardGridSection
  resources: CardGridSection
}

function getButtonIcon(iconOverride?: string) {
  if (iconOverride === 'download') {
    return <IconMask src="/icons/download.svg" className="size-[15px]" />
  }
  if (iconOverride === 'none') {
    return false
  }
  return undefined
}

function paragraphs(value?: string) {
  if (!value) return []
  return value.split('\n\n').filter(Boolean)
}

function BasecampCta({ cta, className }: { cta: CTA; className?: string }) {
  return (
    <Button
      href={cta.href}
      variant={cta.variant ?? 'secondary'}
      icon={getButtonIcon(cta.iconOverride)}
      className={className}
      target={cta.external ? '_blank' : undefined}
      rel={cta.external ? 'noopener noreferrer' : undefined}
    >
      {cta.label}
    </Button>
  )
}

function HeroSectionView({ data }: { data: HeroSection }) {
  const bodyDetails = paragraphs(data.bodySecondary)

  return (
    <section className="mx-auto grid w-full max-w-360 grid-cols-1 gap-12 px-3 pt-[90px] pb-10 md:min-h-[453px] md:grid-cols-2 md:gap-6">
      <div className="flex flex-col items-start gap-10">
        {data.eyebrow ? (
          <Button
            href="/technology-stack"
            variant="tertiary"
            icon={
              <IconMask
                src="/icons/arrow-right.svg"
                className="order-first size-[14px] rotate-180"
              />
            }
            className="cursor-pointer px-0 py-0"
          >
            {data.eyebrow}
          </Button>
        ) : null}
        <h1 className="text-h3 flex items-center gap-3 text-brand-dark-green">
          <LogosMark size={26} className="shrink-0" />
          {data.headline}
        </h1>
      </div>

      <div className="flex max-w-[393px] flex-col gap-6">
        {data.body ? (
          <p className="text-mono-s max-w-[342px] text-brand-dark-green">
            {data.body}
          </p>
        ) : null}
        {bodyDetails.length > 0 ? (
          <div className="text-mono-s flex max-w-[342px] flex-col gap-3 text-brand-dark-green">
            {bodyDetails.map((item) => (
              <p key={item} className="whitespace-pre-line">
                {item}
              </p>
            ))}
          </div>
        ) : null}
        <div className="h-px w-full bg-brand-dark-green/10" />
        {data.ctas ? (
          <div className="flex flex-col items-start gap-6">
            {data.ctas.map((cta) => (
              <BasecampCta
                key={cta.label}
                cta={cta}
                className="cursor-pointer"
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function HowItWorksSection({ data }: { data: TableSection }) {
  const downloadActions = [
    data.action,
    data.rows[0]?.secondaryCta,
    data.rows[0]?.cta,
  ].filter((cta): cta is CTA => Boolean(cta))

  return (
    <section className="mx-auto grid w-full max-w-360 gap-6 px-3 py-10 md:grid-cols-2 md:py-3">
      <div className="flex min-h-[626px] flex-col justify-between gap-8">
        <div>
          <h2 className="text-h3 mb-6 text-brand-dark-green">{data.title}</h2>
          <div className="divide-y divide-brand-dark-green/20 border-y border-brand-dark-green/20">
            {data.rows.map((row) => (
              <article
                key={row.number}
                className="grid gap-4 py-3 md:grid-cols-2 md:gap-3"
              >
                <span className="text-mono-s text-brand-dark-green">
                  {row.number}
                </span>
                <div className="grid gap-2">
                  {row.description ? (
                    <p className="text-mono-s text-brand-dark-green">
                      {row.description}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
        {downloadActions.length > 0 ? (
          <div className="flex flex-wrap items-start gap-1">
            {downloadActions.map((cta) => (
              <BasecampCta
                key={cta.label}
                cta={cta}
                className="cursor-pointer"
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className="relative min-h-[420px] overflow-hidden rounded-xl md:min-h-[626px]">
        <Image
          src="/images/basecamp/how-it-works.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 702px"
          className="object-cover"
        />
      </div>
    </section>
  )
}

function LocalFirstSection({ data }: { data: CtaPanelSection }) {
  return (
    <section className="mx-auto grid w-full max-w-360 gap-6 bg-gray-01 px-3 py-3 md:grid-cols-2">
      <div className="relative min-h-[357px] overflow-hidden rounded-xl">
        {data.image ? (
          <Image
            src={data.image.src}
            alt={data.image.alt}
            fill
            sizes="(max-width: 768px) 100vw, 702px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="flex min-h-[357px] flex-col justify-between gap-10 py-1">
        {data.eyebrow ? (
          <div className="text-mono-s flex items-center gap-[102px] text-brand-dark-green">
            <LogosMark size={9} />
            <span>{data.eyebrow}</span>
          </div>
        ) : null}
        <div className="max-w-[485px]">
          <h2 className="text-h3 mb-3 text-brand-dark-green">{data.title}</h2>
          <div className="text-body-s flex flex-col gap-3 text-brand-dark-green">
            {paragraphs(data.description).map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
          {data.cta ? (
            <BasecampCta
              cta={data.cta}
              className="mt-6 cursor-pointer bg-transparent"
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}

function ModularSection({ data }: { data: FeaturedTextSection }) {
  return (
    <section className="mx-auto grid w-full max-w-360 gap-10 border-b border-brand-dark-green/10 px-3 py-10 md:min-h-[275px] md:grid-cols-2">
      <h2 className="text-h3 text-brand-dark-green">
        {data.title.highlight} {data.title.rest}
      </h2>
      <div className="text-mono-s max-w-[345px] text-brand-dark-green">
        {data.body?.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </section>
  )
}

function CapabilityCard({ card }: { card: CardGridSection['cards'][number] }) {
  return (
    <article className="flex min-h-[250px] flex-col justify-between rounded-xl bg-gray-01 p-4">
      <div className="grid gap-3">
        <h3 className="text-subhead-sans text-brand-dark-green">
          {card.title}
        </h3>
        {card.description ? (
          <p className="text-body-s max-w-[329px] text-brand-dark-green">
            {card.description}
          </p>
        ) : null}
      </div>
      {card.cta ? (
        <BasecampCta cta={card.cta} className="w-fit cursor-pointer" />
      ) : null}
    </article>
  )
}

function CapabilitiesSection({ data }: { data: CardGridSection }) {
  return (
    <section className="mx-auto w-full max-w-360 px-3 py-6 md:py-10">
      {data.heading ? (
        <h2 className="text-h3 mb-10 text-brand-dark-green">{data.heading}</h2>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        {data.cards.map((card) => (
          <CapabilityCard key={card.title} card={card} />
        ))}
      </div>
    </section>
  )
}

function ResourceCard({
  card,
  featured,
}: {
  card: CardGridSection['cards'][number]
  featured?: boolean
}) {
  const content = (
    <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <h3
        className={
          featured
            ? 'text-subhead-sans text-brand-off-white'
            : 'text-subhead-sans text-brand-dark-green'
        }
      >
        {card.title}
      </h3>
      {card.description ? (
        <p
          className={
            featured
              ? 'text-mono-s max-w-[380px] text-brand-off-white'
              : 'text-mono-s max-w-[380px] text-brand-dark-green'
          }
        >
          {card.description}
        </p>
      ) : null}
      {card.cta ? (
        <BasecampCta
          cta={card.cta}
          className={
            featured
              ? 'mt-3 cursor-pointer bg-brand-off-white text-brand-dark-green'
              : 'mt-3 cursor-pointer'
          }
        />
      ) : null}
    </div>
  )

  if (featured) {
    return (
      <article className="relative min-h-[500px] overflow-hidden rounded-full bg-brand-dark-green">
        {card.image ? (
          <>
            <Image
              src={card.image.src}
              alt={card.image.alt}
              fill
              sizes="(max-width: 768px) 100vw, 464px"
              className="scale-125 object-cover blur-[18px]"
            />
            <div className="absolute inset-0 bg-brand-dark-green/35" />
          </>
        ) : null}
        {content}
      </article>
    )
  }

  return (
    <article className="min-h-[500px] border border-brand-dark-green bg-brand-off-white first:rounded-none last:rounded-[60px] last:border-0 last:bg-gray-01">
      {content}
    </article>
  )
}

function ResourcesSection({ data }: { data: CardGridSection }) {
  return (
    <section className="mx-auto grid w-full max-w-360 gap-3 px-3 py-10 md:grid-cols-3">
      {data.cards.map((card, index) => (
        <ResourceCard key={card.title} card={card} featured={index === 1} />
      ))}
    </section>
  )
}

export default function BasecampPage({
  hero,
  howItWorks,
  localFirst,
  modular,
  capabilities,
  resources,
}: BasecampPageProps) {
  return (
    <>
      <HeroSectionView data={hero} />
      <HowItWorksSection data={howItWorks} />
      <LocalFirstSection data={localFirst} />
      <ModularSection data={modular} />
      <CapabilitiesSection data={capabilities} />
      <ResourcesSection data={resources} />
    </>
  )
}
