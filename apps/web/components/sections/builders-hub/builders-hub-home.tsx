import Image from 'next/image'
import type { ReactNode } from 'react'
import type {
  BuilderHubHomeIdeaResolution,
  BuilderHubHomeRfpResolution,
} from '@repo/content/loaders'
import type { BuilderHubSettings } from '@repo/content/schemas'
import { LogosMark } from '@acid-info/logos-ui'

import { Button, ButtonArrowIcon } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
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
      <AppInstallSection data={settings.appInstall} />
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
        <p className="absolute top-6 left-[203px] w-[178px] text-mono-s md:left-1/2 md:w-[226px] md:translate-x-[6px]">
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

      <h1 className="absolute top-[140px] left-[-35px] w-[464px] text-center font-display text-[40px] leading-[0.86] tracking-[-0.03em] text-brand-dark-green md:left-1/2 md:-translate-x-1/2 md:text-[56px]">
        <span className="block">Logos</span>
        <span className="block">Builders Hub</span>
      </h1>

      {hero.description ? (
        <p className="absolute top-[279px] left-[203px] w-[178px] text-mono-s md:top-[307px] md:left-1/2 md:w-[226px] md:translate-x-[6px]">
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
    <section className="px-3 pb-[100px] md:pb-[100px]">
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
        <span className="font-display text-[30px] leading-none tracking-[-0.03em] text-brand-dark-green/50 md:text-[36px]">
          {index}
        </span>
        <h2 className="text-[30px] leading-none tracking-[-0.02em] md:text-h3-sans">
          {title}
        </h2>
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
          <div className="flex -translate-x-[232px] gap-3 md:translate-x-0">
            {featuredIdeas.map((idea) => (
              <div
                key={idea.slug}
                className="flex h-[108px] w-[270px] shrink-0 flex-col gap-3 rounded-xl bg-gray-01 p-3"
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
            className="absolute top-[185px] left-[31px] h-[218px] w-[644px] object-cover mix-blend-darken md:top-[179px] md:left-[15px] md:h-[227px] md:w-[670px]"
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
            className="flex h-[300px] flex-col items-center justify-between rounded-xl bg-accent-light-blue px-4 pt-[60px] pb-3 text-center md:h-[370px]"
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
            <p className="w-[338px] text-mono-s">{data.prizeDescription}</p>
          </div>
        </Link>

        <div className="flex h-[370px] flex-col items-center justify-center overflow-hidden rounded-xl border border-brand-dark-green px-4 py-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <h3 className="text-subhead-sans">{data.rfpsTitle}</h3>
            <p className="w-[338px] text-mono-s">{data.rfpsDescription}</p>
          </div>
          <div className="mt-[60px] flex w-[1416px] -translate-x-[176px] gap-3">
            {previewRfps.map((rfp, index) => (
              <Link
                key={rfp.slug}
                href={`${ROUTES.rfps}/${rfp.slug}`}
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

function AppInstallSection({
  data,
}: {
  data: BuilderHubSettings['appInstall']
}) {
  return (
    <section id="app-install" className="px-3 pb-10">
      <div className="relative flex min-h-[828px] flex-col overflow-hidden rounded-[100px] bg-gray-01 p-3 pb-14 md:block md:h-[590px] md:min-h-0 md:rounded-[200px] md:p-0">
        <div className="relative aspect-square w-full overflow-hidden rounded-[88px] md:absolute md:top-3 md:left-3 md:h-[566px] md:w-[566px] md:rounded-[188px]">
          <Image
            src={data.image.src}
            alt={data.image.alt}
            fill
            sizes="566px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col items-center gap-10 pt-20 text-center md:absolute md:top-1/2 md:left-[714px] md:w-[464px] md:-translate-y-1/2 md:items-start md:pt-0 md:text-left">
          <div>
            <h2 className="text-h3-serif">{data.title}</h2>
            <p className="mt-6 w-[260px] text-body-sans md:w-[464px]">{data.description}</p>
            <div className="mx-auto mt-5 flex max-w-[260px] flex-wrap justify-center gap-[6px] md:mx-0 md:max-w-none md:justify-start">
              {data.tags.map((tag) => (
                <span
                  key={tag.label}
                  className="rounded-xl bg-brand-off-white/50 px-2 py-1.5 text-[10px] leading-[1.2] md:px-2.5 md:py-2 md:text-body-sans"
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
      className="border-t border-brand-dark-green/10 bg-brand-off-white px-3 pt-[39px] pb-[100px] text-brand-dark-green"
    >
      <div className="md:grid md:grid-cols-[1fr_1fr] md:gap-3">
        <h2 className="text-h3-serif whitespace-nowrap">
          {data.title}
        </h2>
        <p className="mt-5 w-[226px] text-mono-s md:mt-0">
          {data.description}
        </p>
      </div>

      <div className="mt-[31px] grid gap-3 md:mt-[78px] md:grid-cols-3">
        {data.categories.map((category) => (
          <div key={category.title} className="w-full">
            <h3 className="flex h-[45px] items-start px-3 py-3 text-subhead-sans">
              {category.title}
            </h3>
            <ul className="overflow-hidden rounded-xl">
              {category.links.map((link, index) => (
                <li key={`${category.title}-${link.title}-${index}`}>
                  <Link
                    href={link.cta.href}
                    aria-label={`${link.title}: ${link.cta.label}`}
                    className={`flex h-[60px] cursor-pointer items-start gap-3 py-3 pr-3 pl-3 transition-colors hover:bg-accent-light-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow ${
                      index % 2 === 0 ? 'bg-gray-01' : 'bg-brand-dark-green/5'
                    }`}
                    {...externalProps(link.cta)}
                  >
                    <span className="w-[18px] shrink-0 pt-1 text-body-sans font-medium">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="flex min-w-0 flex-col gap-[6px]">
                      <span className="text-body-serif whitespace-nowrap">
                        {link.title}
                      </span>
                      <span className="w-[312px] max-w-full text-mono-s">
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
