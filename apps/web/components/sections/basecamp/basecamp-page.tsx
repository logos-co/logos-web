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
import ContentWidth from '@/components/layout/content-width'
import { OverviewMediaPanel } from '@/components/sections/shared/overview-media-panel'
import {
  TechStackDetailPage,
  TechStackDetailSection,
} from '@/components/sections/shared/tech-stack-detail-layout'
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
    <section className="grid w-full grid-cols-1 gap-12 px-3 pt-8 pb-12 md:min-h-[453px] md:grid-cols-2 md:gap-6 md:pb-10">
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
          <div className="text-mono-s flex max-w-[342px] flex-col gap-4 text-brand-dark-green">
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
    <section className="grid w-full gap-6 px-3 py-10 md:grid-cols-2 md:py-10">
      <div className="flex min-h-[626px] flex-col justify-between gap-8">
        <div>
          <h2 className="text-h3 mb-8 text-brand-dark-green">{data.title}</h2>
          <div className="divide-y divide-brand-dark-green/20 border-y border-brand-dark-green/20">
            {data.rows.map((row) => (
              <article
                key={row.number}
                className="grid gap-4 py-4 md:grid-cols-2 md:gap-3"
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
    <section>
      <OverviewMediaPanel
        eyebrow={data.eyebrow}
        footerLabel={data.footerLabel}
        title={data.title}
        body={paragraphs(data.description)}
        cta={data.cta}
        imagePosition="left"
        image={
          <div className="relative h-[317px] w-full overflow-hidden rounded-[24px] md:h-full">
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
        }
      />
    </section>
  )
}

function ModularSection({ data }: { data: FeaturedTextSection }) {
  return (
    <section className="grid w-full gap-10 border-b border-brand-dark-green/10 px-3 py-10 md:min-h-[275px] md:grid-cols-2">
      <h2 className="font-sans text-[24px] font-normal leading-[1.1] tracking-[-0.24px] text-brand-dark-green">
        <span>{data.title.highlight}</span>
        <br />
        <span>{data.title.rest}</span>
      </h2>
      <div className="text-mono-s flex flex-col gap-4 max-w-[345px] text-brand-dark-green">
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
      <div className="grid gap-4">
        <h3 className="font-sans text-[24px] font-normal leading-[1.1] tracking-[-0.24px] text-brand-dark-green">
          {card.title}
        </h3>
        {card.description ? (
          <p className="max-w-[329px] font-sans text-[14px] leading-[1.2] text-brand-dark-green">
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
    <section className="w-full px-3 py-10 md:py-10">
      {data.heading ? (
        <h2 className="mb-12 font-sans text-[24px] font-normal leading-[1.1] tracking-[-0.24px] text-brand-dark-green">
          {data.heading}
        </h2>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
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
    <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
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
              ? 'mt-4 cursor-pointer bg-brand-off-white text-brand-dark-green'
              : 'mt-4 cursor-pointer'
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
    <section className="w-full gap-4 px-3 py-10 grid md:grid-cols-3">
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
    <TechStackDetailPage>
      <ContentWidth className="!p-0">
        <HeroSectionView data={hero} />
        <TechStackDetailSection>
          <HowItWorksSection data={howItWorks} />
        </TechStackDetailSection>
        <TechStackDetailSection>
          <LocalFirstSection data={localFirst} />
        </TechStackDetailSection>
        <TechStackDetailSection>
          <ModularSection data={modular} />
        </TechStackDetailSection>
        <TechStackDetailSection>
          <CapabilitiesSection data={capabilities} />
        </TechStackDetailSection>
        <TechStackDetailSection>
          <ResourcesSection data={resources} />
        </TechStackDetailSection>
      </ContentWidth>
    </TechStackDetailPage>
  )
}
