import { z } from 'zod'

import { linkHrefSchema } from '../common'
import { sectionKeySchema } from './shared'

const gsItemSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1).optional(),
})

export const getStartedCopySectionSchema = z.object({
  componentType: z.literal('getStartedCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  intro: z.string().min(1),
  sections: z.object({
    install: z.object({
      number: z.string().min(1),
      heading: z.string().min(1),
      cardTitle: z.string().min(1),
      body: z.string().min(1),
      cta: z.string().min(1),
      imageAlt: z.string().min(1),
    }),
    docs: z.object({
      number: z.string().min(1),
      heading: z.string().min(1),
      items: z.record(gsItemSchema),
      viewDocsCta: z.string().min(1),
      learnMoreCta: z.string().min(1),
      atomicSwapsCta: z.string().min(1),
      multisigCta: z.string().min(1),
    }),
    community: z.object({
      number: z.string().min(1),
      heading: z.string().min(1),
      cta: z.string().min(1),
      items: z.record(z.string().min(1)),
    }),
    build: z.object({
      number: z.string().min(1),
      heading: z.string().min(1),
      cta: z.string().min(1),
      nodeCta: z.string().min(1),
      messagingCta: z.string().min(1),
      deployCta: z.string().min(1),
      tryItOutCta: z.string().min(1),
      scaffoldCta: z.string().min(1),
      items: z.record(gsItemSchema),
    }),
  }),
})
export type GetStartedCopySection = z.infer<
  typeof getStartedCopySectionSchema
>

const mvCtaGroup = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1),
})

export const movementCopySectionSchema = z.object({
  componentType: z.literal('movementCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  hero: z.object({
    title: z.string().min(1),
    kicker: z.string().min(1).optional(),
    body: z.string().min(1),
    primaryCta: z.string().min(1).optional(),
    secondaryCta: z.string().min(1).optional(),
  }),
  intro: z.object({
    titleLine1: z.string().min(1),
    titleLine2: z.string().min(1),
    body: z.string().min(1),
  }),
  actions: z.object({
    activism: mvCtaGroup,
    coalition: mvCtaGroup,
    building: mvCtaGroup,
  }),
  campaign: z.object({
    eyebrow: z.string().min(1),
    kicker: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    primaryCta: z.string().min(1),
    secondaryCta: z.string().min(1),
    tertiaryCta: z.string().min(1),
  }),
  find: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    cta: z.string().min(1),
  }),
  activismSection: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    cta: z.string().min(1),
  }),
  events: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    cta: z.string().min(1),
    day1: z.object({ date: z.string().min(1), weekday: z.string().min(1) }),
    day2: z.object({ date: z.string().min(1), weekday: z.string().min(1) }),
    day3: z.object({ date: z.string().min(1), weekday: z.string().min(1) }),
    card: z.object({
      title: z.string().min(1),
      time: z.string().min(1),
      timezone: z.string().min(1),
      location: z.string().min(1),
      hosts: z.string().min(1),
    }),
  }),
  involved: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    primaryCta: z.string().min(1),
    secondaryCta: z.string().min(1),
  }),
  coalition: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    cta: z.string().min(1),
  }),
  builder: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    primaryCta: z.string().min(1),
    secondaryCta: z.string().min(1),
    feature: z.object({
      city: z.string().min(1),
      title: z.string().min(1),
      cta: z.string().min(1),
    }),
    details: z.object({
      problem: z.object({ label: z.string().min(1), body: z.string().min(1) }),
      solution: z.object({
        label: z.string().min(1),
        body: z.string().min(1),
      }),
      stack: z.object({ label: z.string().min(1), body: z.string().min(1) }),
    }),
  }),
  resources: z.object({
    titleLine1: z.string().min(1),
    titleLine2: z.string().min(1),
    body: z.string().min(1),
    cta: z.string().min(1),
    rows: z.record(
      z.object({
        number: z.string().min(1),
        title: z.string().min(1),
        body: z.string().min(1),
        cta: z.string().min(1),
      })
    ),
  }),
})
export type MovementCopySection = z.infer<typeof movementCopySectionSchema>

export const bookCopySectionSchema = z.object({
  componentType: z.literal('bookCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
})
export type BookCopySection = z.infer<typeof bookCopySectionSchema>

const designGuideDownloadSchema = z.object({
  label: z.string().min(1),
  href: linkHrefSchema,
})

export const designGuideCopySectionSchema = z.object({
  componentType: z.literal('designGuideCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  intro: z.string().min(1),
  downloads: z.object({
    brandMarks: designGuideDownloadSchema,
    guidelinesSection: z.string().min(1),
    guidelines: designGuideDownloadSchema,
  }),
})
export type DesignGuideCopySection = z.infer<
  typeof designGuideCopySectionSchema
>

export const activistBuilderCopySectionSchema = z.object({
  componentType: z.literal('activistBuilderCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  intro: z.string().min(1),
  privacy: z.string().min(1),
  privacyLink: z.string().url(),
})
export type ActivistBuilderCopySection = z.infer<
  typeof activistBuilderCopySectionSchema
>

export const activistLeaderStewardCopySectionSchema = z.object({
  componentType: z.literal('activistLeaderStewardCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  intro: z.string().min(1),
  privacy: z.string().min(1),
  privacyLink: z.string().url(),
})
export type ActivistLeaderStewardCopySection = z.infer<
  typeof activistLeaderStewardCopySectionSchema
>

export const coalitionPartnerCopySectionSchema = z.object({
  componentType: z.literal('coalitionPartnerCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  intro: z.string().min(1),
  privacy: z.string().min(1),
  privacyLink: z.string().url(),
})
export type CoalitionPartnerCopySection = z.infer<
  typeof coalitionPartnerCopySectionSchema
>

const researchLinkItemSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
})

const researchResourceItemSchema = z.object({
  number: z.string().min(1),
  label: z.string().min(1),
  href: z.string().min(1),
  cta: z.string().min(1).optional(),
})

export const researchCopySectionSchema = z.object({
  componentType: z.literal('researchCopy'),
  key: sectionKeySchema,
  hero: z.object({
    kicker: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    ctas: z.array(researchLinkItemSchema),
  }),
  overview: z.object({
    title: z.string().min(1),
    body: z.object({
      paragraphs: z.record(z.string().min(1), z.string().min(1)),
    }),
    cta: researchLinkItemSchema,
  }),
  resources: z.object({
    title: z.string().min(1),
    learnMore: z.string().min(1),
    items: z.array(researchResourceItemSchema),
  }),
  contribute: z.object({
    title: z.string().min(1),
    copy: z.object({
      howTitle: z.string().min(1),
      contact: z.string().min(1),
      jobs: z.string().min(1),
      links: z.object({
        discord: z.string().min(1),
        forum: z.string().min(1),
        github: z.string().min(1),
        jobs: z.string().min(1),
      }),
      whatTitle: z.string().min(1),
      whatBody: z.string().min(1),
      codeIntro: z.string().min(1),
      codeLinks: z.array(researchLinkItemSchema),
    }),
  }),
})
export type ResearchCopySection = z.infer<typeof researchCopySectionSchema>

const nodeProgrammeStackItemSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  icon: z.string().min(1),
  alt: z.string().min(1),
})

const nodeProgrammeUseCaseItemSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
})

export const nodeProgrammeCopySectionSchema = z.object({
  componentType: z.literal('nodeProgrammeCopy'),
  key: sectionKeySchema,
  hero: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    cta: z.string().min(1),
    secondaryCta: z.string().min(1),
    guideCta: z.string().min(1),
  }),
  builders: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    imageAlt: z.string().min(1),
  }),
  stack: z.object({
    title: z.string().min(1),
    titleMuted: z.string().min(1),
    items: z.array(nodeProgrammeStackItemSchema).min(1),
  }),
  useCases: z.object({
    title: z.string().min(1),
    titleMuted: z.string().min(1),
    items: z.array(nodeProgrammeUseCaseItemSchema).min(1),
  }),
  signup: z.object({
    title: z.string().min(1),
    emailLabel: z.string().min(1),
    emailPlaceholder: z.string().min(1),
    roleLabel: z.string().min(1),
    rolePlaceholder: z.string().min(1),
    roles: z.array(z.string().min(1)).min(1),
    submit: z.string().min(1),
    submitting: z.string().min(1),
    invalidEmail: z.string().min(1),
    missingRole: z.string().min(1),
    genericError: z.string().min(1),
    success: z.string().min(1),
    successLink: z.string().min(1),
    imageAlt: z.string().min(1),
  }),
})
export type NodeProgrammeCopySection = z.infer<
  typeof nodeProgrammeCopySectionSchema
>

const lambdaPrizeRowSchema = z.object({
  label: z.string().min(1),
  body: z.string().min(1),
})

const lambdaPrizeSupportRowSchema = z.object({
  label: z.string().min(1),
  body: z.string().min(1),
  action: z.string().min(1),
  href: z.string().min(1).optional(),
})

const lambdaPrizePrizeMetaSchema = z.object({
  id: z.string().min(1),
  effort: z.string().min(1),
  prize: z.string().min(1),
})

const lambdaPrizePrizeSchema = z.object({
  meta: lambdaPrizePrizeMetaSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().min(1),
})

export const lambdaPrizeCopySectionSchema = z.object({
  componentType: z.literal('lambdaPrizeCopy'),
  key: sectionKeySchema,
  hero: z.object({
    label: z.string().min(1),
    heading: z.string().min(1),
    body: z.string().min(1),
    primaryCta: z.string().min(1),
    secondaryCta: z.string().min(1),
  }),
  howItWorks: z.object({
    heading: z.string().min(1),
    rows: z.array(lambdaPrizeRowSchema).min(1),
  }),
  evaluation: z.object({
    heading: z.string().min(1),
    primaryCta: z.string().min(1),
    secondaryCta: z.string().min(1),
    rows: z.array(lambdaPrizeRowSchema).min(1),
  }),
  featured: z.object({
    heading: z.string().min(1),
    status: z.string().min(1),
    prizes: z.array(lambdaPrizePrizeSchema).min(1),
  }),
  about: z.object({
    heading: z.string().min(1),
    body: z.string().min(1),
    primaryCta: z.string().min(1),
    secondaryCta: z.string().min(1),
    rows: z.array(lambdaPrizeRowSchema).min(1),
  }),
  techStack: z.object({
    startBuildingCta: z.string().min(1),
    docsCta: z.string().min(1),
  }),
  support: z.object({
    heading: z.string().min(1),
    body: z.string().min(1),
    cta: z.string().min(1),
    ctaHref: z.string().min(1).optional(),
    rows: z.array(lambdaPrizeSupportRowSchema).min(1),
  }),
})
export type LambdaPrizeCopySection = z.infer<
  typeof lambdaPrizeCopySectionSchema
>

export const mediaCopySectionSchema = z.object({
  componentType: z.literal('mediaCopy'),
  key: sectionKeySchema,
  hero: z.object({
    line1: z.string().min(1),
    line2: z.string().min(1),
    tagline: z.string().min(1),
  }),
  nav: z.object({
    label: z.string().min(1),
    articles: z.string().min(1),
    podcasts: z.string().min(1),
    broadcast: z.string().min(1),
  }),
  articles: z.object({
    heading: z.string().min(1),
    readArticle: z.string().min(1),
    seeMore: z.string().min(1),
  }),
  podcasts: z.object({
    heading: z.string().min(1),
    media: z.string().min(1),
    heroTitle: z.string().min(1),
    heroDescription: z.string().min(1),
    latestEpisode: z.string().min(1),
    seeAllEpisodes: z.string().min(1),
    listenOnApp: z.string().min(1),
    cta: z.string().min(1),
    episodePrefix: z.string().min(1),
    fallbackEpisode: z.string().min(1),
  }),
  broadcast: z.object({
    heading: z.string().min(1),
    description: z.string().min(1),
    media: z.string().min(1),
    latestEpisode: z.string().min(1),
    cta: z.string().min(1),
  }),
})
export type MediaCopySection = z.infer<typeof mediaCopySectionSchema>

export const podcastCopySectionSchema = z.object({
  componentType: z.literal('podcastCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  eyebrow: z.string().min(1),
  backToMedia: z.string().min(1),
  intro: z.object({
    description: z.string().min(1),
    hostedBy: z.string().min(1),
  }),
  latestHeading: z.string().min(1),
  latestEpisode: z.string().min(1),
  listenOnApp: z.string().min(1),
  seeAllEpisodes: z.string().min(1),
  episodePrefix: z.string().min(1),
  fallbackEpisode: z.string().min(1),
  podcastCta: z.string().min(1),
})
export type PodcastCopySection = z.infer<typeof podcastCopySectionSchema>

export const broadcastCopySectionSchema = z.object({
  componentType: z.literal('broadcastCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  intro: z.object({
    primary: z.string().min(1),
    secondary: z.string().min(1),
  }),
  events: z.object({
    heading: z.string().min(1),
    fallbackDescription: z.string().min(1),
    host: z.string().min(1),
    nextShow: z.string().min(1),
    yearLabel: z.string().min(1),
    monthLabel: z.string().min(1),
    todayLabel: z.string().min(1),
  }),
  pastEpisodes: z.object({
    heading: z.string().min(1),
  }),
  listenOnApp: z.string().min(1),
})
export type BroadcastCopySection = z.infer<typeof broadcastCopySectionSchema>

export const manifestoCopySectionSchema = z.object({
  componentType: z.literal('manifestoCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  headingLine1: z.string().min(1),
  headingLine2: z.string().min(1),
  author: z.array(z.string().min(1)),
  abstractHeading: z.string().min(1),
  abstractBody: z.string().min(1),
  keywordsHeading: z.string().min(1),
  keywords: z.string().min(1),
  body: z.array(z.string().min(1)),
  moreHeading: z.string().min(1),
  more: z.array(z.string().min(1)),
})
export type ManifestoCopySection = z.infer<typeof manifestoCopySectionSchema>
