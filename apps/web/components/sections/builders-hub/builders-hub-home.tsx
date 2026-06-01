import Image from 'next/image'
import type { ReactNode } from 'react'
import type {
  BuilderHubHomeIdeaResolution,
  BuilderHubHomeRfpResolution,
} from '@repo/content/loaders'
import type { BuilderHubSettings } from '@repo/content/schemas'
import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import { Button, ButtonArrowIcon } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { Link } from '@/i18n/navigation'
import { BuildersHubAppInstall } from './builders-hub-app-install'

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
      <BuildersHubHero hero={settings.hero} />
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
      <BuildersHubAppInstall data={settings.appInstall} />
      {settings.documentation ? (
        <DocumentationSection data={settings.documentation} />
      ) : null}
    </div>
  )
}

function BuildersHubHero({ hero }: { hero: BuilderHubSettings['hero'] }) {
  const ctas = [...(hero.secondaryCtas ?? []), hero.topRightCta].filter(
    (cta): cta is Cta => Boolean(cta)
  )

  return (
    <section className="relative h-[483px] px-3 pt-6 md:h-[487px]">
      <ContentWidth className="relative h-full">
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
          <p className="absolute top-6 left-[calc(50%+6px)] w-[calc(50%-18px)] max-w-[178px] text-mono-s md:left-1/2 md:w-[226px] md:max-w-none md:translate-x-[6px]">
            {hero.eyebrow}
          </p>
        ) : null}

        <div className="absolute top-[279px] left-3 flex flex-col items-start gap-3 md:top-[11px] md:left-[83.33%] md:translate-x-[2px] md:gap-[6px]">
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

        <h1 className="absolute top-[140px] left-1/2 w-[min(464px,calc(100vw-24px))] -translate-x-1/2 text-center font-display text-[40px] leading-[0.86] tracking-[-0.03em] text-brand-dark-green md:w-[464px] md:text-[56px]">
          <span className="block">Logos</span>
          <span className="block">Builders Hub</span>
        </h1>

        {hero.description ? (
          <p className="absolute top-[279px] left-[calc(50%+6px)] w-[calc(50%-18px)] max-w-[178px] text-mono-s md:top-[307px] md:left-1/2 md:w-[226px] md:max-w-none md:translate-x-[6px]">
            {hero.description}
          </p>
        ) : null}
      </ContentWidth>
    </section>
  )
}

function JourneySection({
  data,
}: {
  data: NonNullable<BuilderHubSettings['journey']>
}) {
  return (
    <section className="px-3 pb-[100px] md:pb-[100px]">
      <ContentWidth>
        <h2 className="text-[30px] leading-none tracking-[-0.02em] md:text-h3-sans">
          {data.title}
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-5">
          {data.links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex h-[71px] cursor-pointer flex-col items-start justify-between rounded-xl bg-brand-dark-green p-3 text-brand-off-white md:h-[83px]"
            >
              <span className="font-mono text-[10px] font-semibold leading-[1.35]">
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <span className="inline-flex items-center gap-1 text-subhead-sans">
                {link.label}
                <span className="rotate-90 [&>span]:size-[12px] md:[&>span]:size-[15px]">
                  <ButtonArrowIcon />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </ContentWidth>
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
      <ContentWidth>
        <div className="flex items-baseline gap-3 whitespace-nowrap">
          <span className="font-display text-[30px] leading-none tracking-[-0.03em] text-brand-dark-green/50 md:text-[36px]">
            {index}
          </span>
          <h2 className="text-[30px] leading-none tracking-[-0.02em] md:text-h3-sans">
            {title}
          </h2>
        </div>
        <div className="mt-10">{children}</div>
      </ContentWidth>
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
        <div className="flex h-[370px] flex-col items-center justify-center gap-[60px] overflow-hidden rounded-[200px] border border-brand-dark-green px-4 py-10 [clip-path:inset(0)] [contain:paint]">
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
                className="hidden h-[108px] w-[270px] shrink-0 flex-col gap-3 rounded-xl bg-gray-01 p-3 first:flex md:flex"
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
            className="absolute top-[185px] left-0 h-[218px] w-full object-cover mix-blend-darken md:top-[179px] md:left-[15px] md:h-[227px] md:w-[670px]"
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
            className="flex h-[458px] flex-col gap-[6px] overflow-hidden rounded-xl bg-gray-01 p-[6px] md:h-[589px]"
          >
            {card.image ? (
              <div className="relative h-[314px] overflow-hidden rounded-md md:h-[313px]">
                <Image
                  src={card.image.src}
                  alt={card.image.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className={
                    card.imageFit === 'contain'
                      ? 'object-contain'
                      : 'object-cover'
                  }
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
            className="flex h-[300px] min-w-0 flex-col items-center justify-between rounded-xl bg-accent-light-blue px-4 pt-[60px] pb-3 text-center md:h-[370px]"
          >
            <div className="flex w-full min-w-0 flex-col items-center gap-3">
              <h3 className="text-subhead-sans max-w-full break-words">
                {card.title}
              </h3>
              <p className="w-full max-w-[222px] break-words text-mono-s [overflow-wrap:anywhere]">
                {card.description}
              </p>
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
  const previewRfps = rfps.filter((rfp) => !rfp.featured).slice(0, 4)

  return (
    <SectionFrame id="builder-programs" index="04" title={data.title}>
      <div className="grid gap-3 md:grid-cols-2">
        <Link
          href={data.prizeHref}
          aria-label={`${data.prizeTitle}: ${data.prizeHeading}`}
          className="relative flex h-[370px] cursor-pointer flex-col items-center justify-center gap-10 overflow-hidden rounded-xl px-4 py-10 text-center text-brand-off-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green"
        >
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
            <p className="w-full max-w-[338px] text-mono-s">
              {data.prizeDescription}
            </p>
          </div>
        </Link>

        <div className="flex h-[370px] flex-col items-center justify-center overflow-hidden rounded-xl border border-brand-dark-green px-4 py-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <h3 className="text-subhead-sans">{data.rfpsTitle}</h3>
            <p className="w-full max-w-[338px] text-mono-s">
              {data.rfpsDescription}
            </p>
          </div>
          <div className="mt-[60px] flex w-full justify-center gap-3 md:w-[1416px] md:-translate-x-[176px] md:justify-start">
            {previewRfps.map((rfp, index) => (
              <Link
                key={rfp.slug}
                href={`${ROUTES.rfps}/${rfp.slug}`}
                className={`relative hidden h-[166px] w-full max-w-[345px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-brand-dark-green/50 p-4 first:block md:block md:w-[345px] ${
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
        {data.cards.map((card, index) => (
          <div
            key={card.title}
            className={`flex flex-col items-start justify-between rounded-xl bg-gray-01 p-4 ${
              index === 0 ? 'h-[250px]' : 'h-[171px] md:h-[250px]'
            }`}
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

function DocumentationSection({
  data,
}: {
  data: NonNullable<BuilderHubSettings['documentation']>
}) {
  return (
    <section
      id="resources"
      className="border-t border-brand-dark-green/10 bg-brand-off-white px-3 pt-[39px] pb-[100px] text-brand-dark-green"
    >
      <ContentWidth>
        <div className="md:grid md:grid-cols-[1fr_1fr] md:gap-3">
          <h2 className="text-h3-serif whitespace-nowrap">{data.title}</h2>
          <p className="mt-5 w-[226px] text-mono-s md:mt-0">
            {data.description}
          </p>
        </div>

        <div className="mt-[31px] grid gap-3 md:mt-[78px] md:grid-cols-3">
          {data.categories.map((category) => (
            <div key={category.title} className="min-w-0 w-full">
              <h3 className="flex h-[45px] items-start px-3 py-3 text-subhead-sans">
                {category.title}
              </h3>
              <ul className="overflow-hidden rounded-xl">
                {category.links.map((link, index) => (
                  <li key={`${category.title}-${link.title}-${index}`}>
                    <Link
                      href={link.cta.href}
                      aria-label={`${link.title}: ${link.cta.label}`}
                      className={`flex min-h-[60px] min-w-0 cursor-pointer items-start gap-3 py-3 pr-3 pl-3 transition-colors hover:bg-accent-light-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow ${
                        index % 2 === 0 ? 'bg-gray-01' : 'bg-brand-dark-green/5'
                      }`}
                      {...externalProps(link.cta)}
                    >
                      <span className="w-[18px] shrink-0 pt-1 text-body-sans font-medium">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-[6px]">
                        <span className="break-words text-body-serif">
                          {link.title}
                        </span>
                        <span className="w-full break-words text-mono-s [overflow-wrap:anywhere]">
                          {link.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ContentWidth>
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
