import Image from 'next/image'
import type { ReactNode } from 'react'
import type {
  BuilderHubHomeIdeaResolution,
  BuilderHubHomeRfpResolution,
} from '@repo/content/loaders'
import type { BuilderHubSettings } from '@repo/content/schemas'
import { LogosMark } from '@repo/ui'

import { Button, ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'

type BuildersHubHomeProps = {
  settings: BuilderHubSettings
  rfpResolution: BuilderHubHomeRfpResolution
  ideaResolution: BuilderHubHomeIdeaResolution
}

type Cta = {
  label: string
  href: string
  external?: boolean
  variant?: 'primary' | 'secondary' | 'tertiary' | 'link'
}

export function BuildersHubHome({
  settings,
  rfpResolution,
  ideaResolution,
}: BuildersHubHomeProps) {
  return (
    <div className="bg-brand-off-white">
      <BuildersHubHeroDesktop hero={settings.hero} />
      {settings.journey ? <JourneySection data={settings.journey} /> : null}
      {settings.inspiration ? (
        <InspirationSection
          data={settings.inspiration}
          ideas={ideaResolution.ideas}
        />
      ) : null}
      {settings.prepare ? <PrepareSection data={settings.prepare} /> : null}
      {settings.build ? <BuildSection data={settings.build} /> : null}
      {settings.programs ? (
        <ProgramsSection data={settings.programs} rfps={rfpResolution.rfps} />
      ) : null}
      {settings.support ? <SupportSection data={settings.support} /> : null}
      <AppInstallSection data={settings.appInstall} />
      {settings.documentation ? (
        <DocumentationSection data={settings.documentation} />
      ) : null}
    </div>
  )
}

function BuildersHubHeroDesktop({
  hero,
}: {
  hero: BuilderHubSettings['hero']
}) {
  const ctas = [...(hero.secondaryCtas ?? []), hero.topRightCta].filter(
    (cta): cta is Cta => Boolean(cta)
  )

  return (
    <section className="relative h-[487px] px-3 pt-6">
      <div className="absolute top-6 left-3 h-[75px] w-[107px] overflow-hidden">
        <Image
          src="/images/builders-hub/hero.webp"
          alt=""
          width={125}
          height={157}
          className="absolute -top-[29px] -left-[7px] h-[157px] w-[125px] object-cover"
          priority
        />
      </div>

      {hero.eyebrow ? (
        <p className="absolute top-6 left-1/2 w-[226px] translate-x-[6px] text-mono-s">
          {hero.eyebrow}
        </p>
      ) : null}

      <div className="absolute top-[11px] left-[83.33%] flex translate-x-[2px] flex-col items-start gap-[6px]">
        {ctas.map((cta) => (
          <Button
            key={cta.label}
            href={cta.href}
            variant="link"
            {...externalProps(cta)}
          >
            {cta.label}
          </Button>
        ))}
      </div>

      <h1 className="absolute top-[140px] left-1/2 w-[464px] -translate-x-1/2 text-center font-display text-[56px] leading-[0.86] tracking-[-0.03em] text-brand-dark-green">
        <span className="block">Logos</span>
        <span className="block">Builders Hub</span>
      </h1>

      {hero.description ? (
        <p className="absolute top-[307px] left-1/2 w-[226px] translate-x-[6px] text-mono-s">
          {hero.description}
        </p>
      ) : null}
    </section>
  )
}

function JourneySection({
  data,
}: {
  data: NonNullable<BuilderHubSettings['journey']>
}) {
  return (
    <section className="px-3 pb-[100px]">
      <h2 className="text-h3-sans">{data.title}</h2>
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-5">
        {data.links.map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex h-[83px] cursor-pointer flex-col items-start justify-between rounded-xl bg-brand-dark-green p-3 text-brand-off-white"
          >
            <span className="font-mono text-[10px] font-semibold leading-[1.35]">
              {(index + 1).toString().padStart(2, '0')}
            </span>
            <span className="inline-flex items-center gap-1 text-subhead-sans">
              {link.label}
              <span className="rotate-90">
                <ButtonArrowIcon />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function SectionFrame({
  id,
  index,
  title,
  children,
}: {
  id: string
  index: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="border-t border-brand-dark-green/10 px-3 pt-6 pb-[100px]"
    >
      <div className="flex items-baseline gap-3 whitespace-nowrap">
        <span className="font-display text-[36px] leading-none tracking-[-0.03em] text-brand-dark-green/50">
          {index}
        </span>
        <h2 className="text-h3-sans">{title}</h2>
      </div>
      <div className="mt-10">{children}</div>
    </section>
  )
}

function InspirationSection({
  data,
  ideas,
}: {
  data: NonNullable<BuilderHubSettings['inspiration']>
  ideas: BuilderHubHomeIdeaResolution['ideas']
}) {
  const featuredIdeas = ideas.slice(0, 3)

  return (
    <SectionFrame id="get-inspired" index="01" title={data.title}>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex h-[370px] flex-col items-center justify-center gap-[60px] overflow-hidden rounded-[200px] border border-brand-dark-green px-4 py-10">
          <div className="text-center">
            <h3 className="text-subhead-sans">{data.ideasTitle}</h3>
            <p className="mx-auto mt-3 w-[222px] text-mono-s">
              {data.ideasDescription}
            </p>
          </div>
          <div className="flex gap-3">
            {featuredIdeas.map((idea) => (
              <div
                key={idea.slug}
                className="flex h-[108px] w-[270px] shrink-0 flex-col gap-3 rounded-xl bg-brand-yellow p-3"
              >
                <div className="flex justify-between gap-4">
                  <p className="w-[163px] font-display text-[14px] leading-[1.2]">
                    {idea.title}
                  </p>
                  {idea.reward ? (
                    <p className="text-right text-mono-s">
                      {idea.reward.amount} {idea.reward.currency}
                      {idea.reward.xp ? (
                        <>
                          <br />+ {idea.reward.xp} XP
                        </>
                      ) : null}
                    </p>
                  ) : null}
                </div>
                <p className="border-t border-brand-dark-green/10 pt-3 text-mono-s">
                  {idea.tagline ?? idea.summary}
                  <br />
                  Idea by @{idea.submitter.handle}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex h-[370px] flex-col items-center overflow-hidden border border-brand-dark-green px-4 py-10">
          <div className="pt-[31px] text-center">
            <h3 className="text-subhead-sans">{data.issuesTitle}</h3>
            <p className="mx-auto mt-3 w-[222px] text-mono-s">
              {data.issuesDescription}
            </p>
          </div>
          <Image
            src={data.issuesImage.src}
            alt={data.issuesImage.alt}
            width={data.issuesImage.width}
            height={data.issuesImage.height}
            className="absolute top-[179px] left-[15px] h-[227px] w-[670px] object-cover mix-blend-darken"
          />
        </div>
      </div>
    </SectionFrame>
  )
}

function PrepareSection({
  data,
}: {
  data: NonNullable<BuilderHubSettings['prepare']>
}) {
  return (
    <SectionFrame id="prepare" index="02" title={data.title}>
      <div className="grid gap-3 md:grid-cols-2">
        {data.cards.map((card) => (
          <div
            key={card.title}
            className="flex h-[589px] flex-col gap-[6px] overflow-hidden rounded-xl bg-gray-01 p-[6px]"
          >
            {card.image ? (
              <div className="relative h-[313px] overflow-hidden rounded-md">
                <Image
                  src={card.image.src}
                  alt={card.image.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <h3 className="text-subhead-sans">{card.title}</h3>
              <p className="w-[338px] max-w-full text-mono-s">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  )
}

function BuildSection({
  data,
}: {
  data: NonNullable<BuilderHubSettings['build']>
}) {
  return (
    <SectionFrame id="start-building" index="03" title={data.title}>
      <div className="grid gap-3 md:grid-cols-4">
        {data.cards.map((card) => (
          <div
            key={card.title}
            className="flex h-[370px] flex-col items-center justify-between rounded-xl bg-accent-light-blue px-4 pt-[60px] pb-3 text-center"
          >
            <div className="flex flex-col items-center gap-3">
              <h3 className="text-subhead-sans">{card.title}</h3>
              <p className="w-[222px] text-mono-s">{card.description}</p>
            </div>
            <div className="flex w-full flex-col gap-3">
              {card.ctas.map((cta) => (
                <ThinCta key={`${card.title}-${cta.label}`} cta={cta} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  )
}

function ProgramsSection({
  data,
  rfps,
}: {
  data: NonNullable<BuilderHubSettings['programs']>
  rfps: BuilderHubHomeRfpResolution['rfps']
}) {
  return (
    <SectionFrame id="builder-programs" index="04" title={data.title}>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="relative flex h-[370px] flex-col items-center justify-center gap-10 overflow-hidden rounded-xl px-4 py-10 text-center text-brand-off-white">
          <Image
            src={data.prizeImage.src}
            alt={data.prizeImage.alt}
            fill
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative inline-flex items-center gap-[9px]">
            <LogosMark size={18} />
            <span className="text-h4-serif">{data.prizeTitle}</span>
          </div>
          <div className="relative flex flex-col items-center gap-3">
            <h3 className="text-subhead-sans">{data.prizeHeading}</h3>
            <p className="w-[338px] text-mono-s">{data.prizeDescription}</p>
          </div>
        </div>

        <div className="flex h-[370px] flex-col items-center justify-center overflow-hidden rounded-xl border border-brand-dark-green px-4 py-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <h3 className="text-subhead-sans">{data.rfpsTitle}</h3>
            <p className="w-[338px] text-mono-s">{data.rfpsDescription}</p>
          </div>
          <div className="mt-[60px] flex w-[1416px] -translate-x-[373px] gap-3">
            {rfps.slice(0, 4).map((rfp, index) => (
              <Link
                key={rfp.slug}
                href={`/builders-hub/rfps/${rfp.slug}`}
                className={`relative h-[166px] w-[345px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-brand-dark-green/50 p-4 ${
                  index % 2 === 1 ? 'opacity-50' : ''
                }`}
              >
                <h4 className="w-[249px] text-h4-sans">{rfp.title}</h4>
                <span className="absolute top-[83px] left-4 font-mono text-[10px] font-semibold uppercase underline underline-offset-[3px]">
                  {rfp.ctaLabel ?? data.rfpsTitle}
                </span>
                <p className="absolute bottom-4 left-4 w-[186px] text-mono-s">
                  {rfp.tagline ?? rfp.summary}
                </p>
                {rfp.image ? (
                  <Image
                    src={rfp.image.src}
                    alt={rfp.image.alt}
                    width={96}
                    height={120}
                    className="absolute right-[10px] bottom-[11px] h-[120px] w-[96px] object-cover"
                  />
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </SectionFrame>
  )
}

function SupportSection({
  data,
}: {
  data: NonNullable<BuilderHubSettings['support']>
}) {
  return (
    <SectionFrame id="get-support" index="05" title={data.title}>
      <div className="grid gap-3 md:grid-cols-3">
        {data.cards.map((card) => (
          <div
            key={card.title}
            className="flex h-[250px] flex-col items-start justify-between rounded-xl bg-gray-01 p-4"
          >
            <div className="flex flex-col gap-3">
              <h3 className="text-h4-sans">{card.title}</h3>
              {card.description ? (
                <p className="w-[216px] whitespace-pre-line text-body-sans">
                  {card.description}
                </p>
              ) : null}
            </div>
            {card.metrics ? (
              <div className="flex gap-6">
                {card.metrics.map((metric) => (
                  <div key={metric.label} className="w-[42px]">
                    <p className="text-h4-serif">{metric.value}</p>
                    <p className="mt-[6px] text-eyebrow">{metric.label}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <Button
              href={card.cta.href}
              variant="primary"
              className="h-[31px]"
              {...externalProps(card.cta)}
            >
              {card.cta.label}
            </Button>
          </div>
        ))}
      </div>
    </SectionFrame>
  )
}

function AppInstallSection({
  data,
}: {
  data: BuilderHubSettings['appInstall']
}) {
  return (
    <section id="app-install" className="px-3 pb-10">
      <div className="relative h-[590px] overflow-hidden rounded-[200px] bg-gray-01">
        <div className="absolute top-3 left-3 h-[566px] w-[566px] overflow-hidden rounded-[188px]">
          <Image
            src={data.image.src}
            alt={data.image.alt}
            fill
            sizes="566px"
            className="object-cover"
          />
        </div>
        <div className="absolute top-1/2 left-[714px] flex w-[464px] -translate-y-1/2 flex-col items-start gap-10">
          <div>
            <h2 className="text-h3-serif">{data.title}</h2>
            <p className="mt-6 text-body-sans">{data.description}</p>
            <div className="mt-5 flex flex-wrap gap-[6px]">
              {data.tags.map((tag) => (
                <span
                  key={tag.label}
                  className="rounded-xl bg-brand-off-white/50 px-2.5 py-2 text-body-sans"
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2.5">
            <Button href={data.installCta.href} variant="secondary">
              {data.installCta.label}
            </Button>
            <Button href={data.learnMoreCta.href} variant="tertiary">
              {data.learnMoreCta.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function DocumentationSection({
  data,
}: {
  data: NonNullable<BuilderHubSettings['documentation']>
}) {
  return (
    <section
      id="resources"
      className="border-t border-brand-dark-green/10 pt-10"
    >
      <div className="grid px-3 pb-[77px] md:grid-cols-2">
        <h2 className="text-h3-serif">{data.title}</h2>
        <p className="w-[226px] text-mono-s">{data.description}</p>
      </div>
      <div>
        {data.categories.map((category) => (
          <div key={category.title}>
            <h3 className="px-3 py-3 text-subhead-sans">{category.title}</h3>
            <ul>
              {category.links.map((link, index) => (
                <li key={`${category.title}-${link.title}-${index}`}>
                  <Link
                    href={link.cta.href}
                    className={`grid h-[50px] cursor-pointer items-center px-3 md:grid-cols-[1fr_1fr_179px] ${
                      index % 2 === 0 ? 'bg-gray-01' : 'bg-brand-off-white'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-[18px] text-mono-s">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <span className="text-body-serif">{link.title}</span>
                    </span>
                    <span className="text-mono-s">{link.description}</span>
                    <span className="font-mono text-[10px] font-semibold uppercase underline underline-offset-[3px]">
                      {link.cta.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

function ThinCta({ cta }: { cta: Cta }) {
  return (
    <Button
      href={cta.href}
      variant="secondary"
      className="h-[31px] w-full rounded-none py-0"
      {...externalProps(cta)}
    >
      {cta.label}
    </Button>
  )
}

function externalProps(cta: { external?: boolean }) {
  return cta.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}
