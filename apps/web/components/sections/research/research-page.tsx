import type { ResearchCopySection } from '@repo/content/schemas'

import { EXTERNAL_URLS } from '@/constants/routes'
import { renderTaggedText } from '@/lib/render-tagged-text'

import { TextLink } from './_sections/atoms'
import { ContributeSection } from './_sections/contribute-section'
import { HeroSection } from './_sections/hero-section'
import { OverviewSection } from './_sections/overview-section'
import { ResourcesSection } from './_sections/resources-section'
import type { ContributeCopy } from './_sections/types'

const overviewLinkRenderers = {
  logos: (text: string) => <TextLink href={EXTERNAL_URLS.logosHome} label="">{text}</TextLink>,
  ift: (text: string) => <TextLink href={EXTERNAL_URLS.ift} label="">{text}</TextLink>,
  units: (text: string) => <TextLink href={EXTERNAL_URLS.researchServiceUnits} label="">{text}</TextLink>,
  incubator: (text: string) => <TextLink href={EXTERNAL_URLS.researchIncubatorProjects} label="">{text}</TextLink>,
  research: (text: string) => <TextLink href={EXTERNAL_URLS.researchApplied} label="">{text}</TextLink>,
  specs: (text: string) => <TextLink href={EXTERNAL_URLS.vacRfc} label="">{text}</TextLink>,
  forum: (text: string) => <TextLink href={EXTERNAL_URLS.researchForum} label="">{text}</TextLink>,
  principles: (text: string) => <TextLink href={EXTERNAL_URLS.researchPrinciples} label="">{text}</TextLink>,
}

const OVERVIEW_PARAGRAPH_KEYS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'] as const

export default function ResearchPageView({
  data,
}: {
  data: ResearchCopySection
  locale: string
}) {
  const contribute = data.contribute.copy as ContributeCopy

  const overviewParagraphs = OVERVIEW_PARAGRAPH_KEYS.map((key) =>
    renderTaggedText(data.overview.body.paragraphs[key] ?? '', overviewLinkRenderers)
  )

  const contributeContact = renderTaggedText(contribute.contact, {
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

  const contributeJobs = renderTaggedText(contribute.jobs, {
    jobs: () => (
      <TextLink href={EXTERNAL_URLS.iftJobs} label="">
        {contribute.links.jobs}
      </TextLink>
    ),
  })

  return (
    <div className="flex flex-col gap-10 bg-brand-off-white pt-10 pb-10">
      <HeroSection
        kicker={data.hero.kicker}
        title={data.hero.title}
        description={data.hero.description}
        ctas={data.hero.ctas}
      />
      <OverviewSection
        title={data.overview.title}
        paragraphs={overviewParagraphs}
        cta={data.overview.cta}
      />
      <ResourcesSection
        title={data.resources.title}
        learnMoreLabel={data.resources.learnMore}
        items={data.resources.items}
      />
      <ContributeSection
        title={data.contribute.title}
        copy={contribute}
        contact={contributeContact}
        jobs={contributeJobs}
      />
    </div>
  )
}
