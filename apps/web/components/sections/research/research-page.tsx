import { getTranslations } from 'next-intl/server'

import { EXTERNAL_URLS } from '@/constants/routes'

import { TextLink } from './_sections/atoms'
import { ContributeSection } from './_sections/contribute-section'
import { HeroSection } from './_sections/hero-section'
import { OverviewSection } from './_sections/overview-section'
import { ResourcesSection } from './_sections/resources-section'
import type {
  ContributeCopy,
  LinkItem,
  OverviewCopy,
  ResourceItem,
} from './_sections/types'

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
