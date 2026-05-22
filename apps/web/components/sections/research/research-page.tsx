import Image from 'next/image'
import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'

import { ButtonArrowIcon } from '@/components/ui'
import { EXTERNAL_URLS } from '@/constants/routes'
import { Link } from '@/i18n/navigation'

type LinkItem = {
  label: string
  href: string
}

type ResourceItem = LinkItem & {
  number: string
}

type OverviewCopy = {
  paragraphs: string[]
}

type ContributeCopy = {
  howTitle: string
  contact: string
  jobs: string
  links: {
    discord: string
    forum: string
    github: string
    jobs: string
  }
  whatTitle: string
  whatBody: string
  codeIntro: string
  codeLinks: LinkItem[]
}

function isExternalHref(href: string): boolean {
  return /^https?:\/\//.test(href)
}

function TextLink({ href, children }: LinkItem & { children: ReactNode }) {
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer underline underline-offset-2"
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className="cursor-pointer underline underline-offset-2">
      {children}
    </Link>
  )
}

function CtaLink({ label, href }: LinkItem) {
  const className =
    'inline-flex cursor-pointer items-center gap-1 rounded-[4px] font-mono text-[10px] font-semibold uppercase leading-[1.35] text-brand-dark-green'
  const content = (
    <>
      <span>{label}</span>
      <ButtonArrowIcon />
    </>
  )

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}

function LinkButton({ label, href }: LinkItem) {
  const className =
    'inline-flex cursor-pointer items-center gap-1 border-b border-brand-dark-green/50 pb-0.5 font-mono text-[10px] font-semibold uppercase leading-[1.35] text-brand-dark-green'
  const content = (
    <>
      <span>{label}</span>
      <ButtonArrowIcon />
    </>
  )

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  )
}

function HeroSection({
  kicker,
  title,
  description,
  ctas,
}: {
  kicker: string
  title: string
  description: string
  ctas: LinkItem[]
}) {
  return (
    <section className="relative min-h-[447px] overflow-hidden bg-brand-off-white px-3 pt-6 text-brand-dark-green">
      <Image
        src="/images/research/hero-thumb.webp"
        alt=""
        width={107}
        height={75}
        priority
        className="h-[75px] w-[107px] object-cover"
      />
      <p className="text-mono-s absolute left-3 top-28 max-w-[226px] md:left-[calc(50%+6px)] md:top-6">
        {kicker}
      </p>
      <div className="absolute right-3 top-3 flex w-[116px] flex-col items-start gap-1.5 md:right-[calc(16.67%-104px)]">
        {ctas.map((cta) => (
          <CtaLink key={cta.label} {...cta} />
        ))}
      </div>
      <h1 className="text-h2 absolute left-1/2 top-[140px] w-[min(464px,calc(100%-24px))] -translate-x-1/2 whitespace-pre-line text-center text-brand-dark-green">
        {title}
      </h1>
      <p className="text-mono-s absolute left-3 top-[318px] max-w-[345px] md:left-[calc(50%+6px)] md:top-[307px] md:w-[226px]">
        {description}
      </p>
    </section>
  )
}

function OverviewSection({
  title,
  body,
  cta,
}: {
  title: string
  body: OverviewCopy
  cta: LinkItem
}) {
  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white px-3 py-10 text-brand-dark-green md:min-h-[670px]">
      <div className="grid gap-10 md:grid-cols-12 md:gap-3">
        <h2 className="text-[24px] leading-[1.1] tracking-[-0.24px] md:col-span-3">
          {title}
        </h2>
        <div className="text-mono-s space-y-[13px] md:col-span-3 md:col-start-7 md:w-[345px]">
          {body.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="md:col-span-2 md:col-start-11 md:justify-self-start">
          <LinkButton {...cta} />
        </div>
      </div>
    </section>
  )
}

function ResourcesSection({
  title,
  learnMoreLabel,
  items,
}: {
  title: string
  learnMoreLabel: string
  items: ResourceItem[]
}) {
  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white text-brand-dark-green">
      <div className="grid px-3 py-10 md:grid-cols-12">
        <h2 className="text-[24px] leading-[1.1] tracking-[-0.24px] md:col-span-3">
          {title}
        </h2>
      </div>
      <div>
        {items.map((item, index) => (
          <div
            key={item.number}
            className={
              index % 2 === 0
                ? 'bg-brand-dark-green/5'
                : 'bg-[var(--color-gray-01)]'
            }
          >
            <div className="grid min-h-[50px] items-start gap-4 px-3 py-3 md:grid-cols-12 md:gap-3">
              <div className="flex items-baseline gap-3 md:col-span-6">
                <span className="w-[18px] shrink-0 text-[14px] font-medium leading-[1.2]">
                  {item.number}
                </span>
                <span className="font-display text-[14px] leading-[1.2]">
                  {item.label}
                </span>
              </div>
              <div className="md:col-span-2 md:col-start-11">
                <LinkButton label={learnMoreLabel} href={item.href} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ContributeSection({
  title,
  copy,
  contact,
  jobs,
}: {
  title: string
  copy: ContributeCopy
  contact: ReactNode
  jobs: ReactNode
}) {
  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white px-3 py-10 text-brand-dark-green md:min-h-[262px]">
      <div className="grid gap-10 md:grid-cols-12 md:gap-3">
        <h2 className="text-[24px] leading-[1.1] tracking-[-0.24px] md:col-span-3">
          {title}
        </h2>
        <div className="text-mono-s md:col-span-4 md:col-start-7 md:w-[345px]">
          <p className="font-bold">{copy.howTitle}</p>
          <p>{contact}</p>
          <p className="mt-[13px]">{jobs}</p>
          <p className="mt-[26px] font-bold">{copy.whatTitle}</p>
          <p>{copy.whatBody}</p>
          <p className="mt-[26px]">{copy.codeIntro}</p>
          <ul className="list-disc pl-5">
            {copy.codeLinks.map((link) => (
              <li key={link.href}>
                <TextLink href={link.href} label={link.label}>
                  {link.label}
                </TextLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default async function ResearchPageView({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'pages.research' })
  const heroCtas = t.raw('hero.ctas') as LinkItem[]
  const overview = t.raw('overview.body') as OverviewCopy
  const resources = t.raw('resources.items') as ResourceItem[]
  const contribute = t.raw('contribute.copy') as ContributeCopy
  const contributeContact = t.rich('contribute.copy.contact', {
    discord: () => (
      <TextLink href={EXTERNAL_URLS.researchDiscord} label="">
        {contribute.links.discord}
      </TextLink>
    ),
    forum: () => (
      <TextLink href={EXTERNAL_URLS.researchForum} label="">
        {contribute.links.forum}
      </TextLink>
    ),
    github: () => (
      <TextLink href={EXTERNAL_URLS.vacGithub} label="">
        {contribute.links.github}
      </TextLink>
    ),
  })
  const contributeJobs = t.rich('contribute.copy.jobs', {
    jobs: () => (
      <TextLink href={EXTERNAL_URLS.vacJobs} label="">
        {contribute.links.jobs}
      </TextLink>
    ),
  })

  return (
    <div className="flex flex-col gap-10 bg-brand-off-white pt-10 pb-10">
      <HeroSection
        kicker={t('hero.kicker')}
        title={t('hero.title')}
        description={t('hero.description')}
        ctas={heroCtas}
      />
      <OverviewSection
        title={t('overview.title')}
        body={overview}
        cta={{
          label: t('overview.cta.label'),
          href: t('overview.cta.href'),
        }}
      />
      <ResourcesSection
        title={t('resources.title')}
        learnMoreLabel={t('resources.learnMore')}
        items={resources}
      />
      <ContributeSection
        title={t('contribute.title')}
        copy={contribute}
        contact={contributeContact}
        jobs={contributeJobs}
      />
    </div>
  )
}
