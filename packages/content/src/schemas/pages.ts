import { z } from 'zod'

import { builderHubTagSchema, rewardSchema } from './builders-hub'
import {
  ctaSchema,
  httpsUrlSchema,
  isoDateTimeSchema,
  languageSchema,
  linkHrefSchema,
  mediaRefSchema,
  schemaVersion,
} from './common'

/**
 * Internal-only route path. Pages are statically rendered under `/[locale]`,
 * so the stored route is always relative to the locale segment and starts
 * with "/".
 */
const routePathSchema = z
  .string()
  .min(1)
  .refine((value) => value.startsWith('/'), 'route must start with "/"')

/**
 * Section keys mirror Figma section keys (e.g. "home.atf", "home.techStack",
 * "buildersHub.heroSection"). The shape is intentionally permissive — design
 * naming evolves and a regex would just rot.
 */
const sectionKeySchema = z.string().min(1)

// ---------------------------------------------------------------------------
// PageSeo
// ---------------------------------------------------------------------------

export const pageSeoSchema = z.object({
  /** Overrides PageCopy.title for the document `<title>`. */
  metaTitle: z.string().min(1).optional(),
  /** Overrides PageCopy.description for the meta description. */
  metaDescription: z.string().min(1).optional(),
  keywords: z.array(z.string().min(1)).optional(),
  ogImage: mediaRefSchema.optional(),
  noindex: z.boolean().optional(),
  canonicalUrl: httpsUrlSchema.optional(),
})
export type PageSeo = z.infer<typeof pageSeoSchema>

// ---------------------------------------------------------------------------
// Section types (discriminated by `componentType`)
// ---------------------------------------------------------------------------

export const heroSectionSchema = z.object({
  componentType: z.literal('hero'),
  key: sectionKeySchema,
  eyebrow: z.string().min(1).optional(),
  headline: z.string().min(1),
  body: z.string().min(1).optional(),
  bodySecondary: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(1).optional(),
        title: z.string().min(1),
        description: z.string().min(1).optional(),
        href: linkHrefSchema.optional(),
      })
    )
    .optional(),
  status: z
    .object({
      label: z.string().min(1),
      body: z.string().min(1),
      cta: ctaSchema.optional(),
      secondaryCta: ctaSchema.optional(),
    })
    .optional(),
  background: mediaRefSchema.optional(),
  ctas: z.array(ctaSchema).optional(),
})
export type HeroSection = z.infer<typeof heroSectionSchema>

export const richTextSectionSchema = z.object({
  componentType: z.literal('richText'),
  key: sectionKeySchema,
  body: z.string().min(1),
})
export type RichTextSection = z.infer<typeof richTextSectionSchema>

const cardGridCardSchema = z.object({
  label: z.string().min(1).optional(),
  footerLabel: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  image: mediaRefSchema.optional(),
  cta: ctaSchema.optional(),
  secondaryCta: ctaSchema.optional(),
  showIcon: z.boolean().optional(),
})

export const cardGridSectionSchema = z.object({
  componentType: z.literal('cardGrid'),
  key: sectionKeySchema,
  /**
   * Optional small eyebrow label rendered above the heading. Common in mid-
   * page section blocks ("Cryptarchia", "Use Cases") that sit alongside body
   * copy and a section-level CTA.
   */
  eyebrow: z.string().min(1).optional(),
  heading: z.string().min(1).optional(),
  subheading: z.string().min(1).optional(),
  /**
   * Optional second subheading paragraph. Some sections (Use Cases on home
   * and /technology-stack) split a long subheading across two desktop
   * columns; the component renders both side-by-side on desktop and
   * concatenated on mobile.
   */
  subheadingExtra: z.string().min(1).optional(),
  /** Section-level CTA, separate from per-card CTAs. */
  cta: ctaSchema.optional(),
  cards: z.array(cardGridCardSchema).min(1),
})
export type CardGridSection = z.infer<typeof cardGridSectionSchema>

const tableRowSchema = z.object({
  number: z.string().min(1).optional(),
  title: z.string().min(1),
  description: z.string().min(1).optional(),
  reward: rewardSchema.optional(),
  cta: ctaSchema.optional(),
  secondaryCta: ctaSchema.optional(),
})

export const tableSectionSchema = z.object({
  componentType: z.literal('table'),
  key: sectionKeySchema,
  title: z.string().min(1),
  subtitle: z.string().min(1).optional(),
  action: ctaSchema.optional(),
  rows: z.array(tableRowSchema).default([]),
})
export type TableSection = z.infer<typeof tableSectionSchema>

export const giantSwitchSectionSchema = z.object({
  componentType: z.literal('giantSwitch'),
  key: sectionKeySchema,
  accent: z.enum(['grey', 'yellow']),
  imagePosition: z.enum(['left', 'right']),
  title: z.string().min(1),
  description: z.string().min(1),
  image: mediaRefSchema,
  tags: z.array(builderHubTagSchema).optional(),
  primaryCta: ctaSchema.optional(),
  secondaryCta: ctaSchema.optional(),
})
export type GiantSwitchSection = z.infer<typeof giantSwitchSectionSchema>

export const relatedArticlesSectionSchema = z.object({
  componentType: z.literal('relatedArticles'),
  key: sectionKeySchema,
  label: z.string().min(1).optional(),
  mobileLabel: z.string().min(1).optional(),
  eyebrow: z.string().min(1).optional(),
  title: z.string().min(1),
  cta: ctaSchema.optional(),
  items: z
    .array(
      z.object({
        title: z.string().min(1),
        mobileTitle: z.string().min(1).optional(),
        image: mediaRefSchema,
        imagePosition: z.string().min(1).optional(),
        date: z.string().min(1),
        author: z.string().min(1),
        readingTime: z.number().int().positive(),
        href: linkHrefSchema,
      })
    )
    .optional(),
  visibleCount: z.number().int().positive().optional(),
})
export type RelatedArticlesSection = z.infer<
  typeof relatedArticlesSectionSchema
>

export const ctaPanelSectionSchema = z.object({
  componentType: z.literal('ctaPanel'),
  key: sectionKeySchema,
  /** Optional small eyebrow label rendered above the title. */
  eyebrow: z.string().min(1).optional(),
  mobileEyebrow: z.string().min(1).optional(),
  footerLabel: z.string().min(1).optional(),
  title: z.string().min(1),
  mobileTitle: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  mobileDescription: z.string().min(1).optional(),
  image: mediaRefSchema.optional(),
  /**
   * Optional. Some "annotated text + image" sections render without a CTA
   * (e.g. LMN intro on the messaging page). Sections that do need a CTA
   * just provide it; sections that don't omit the field.
   */
  cta: ctaSchema.optional(),
  /**
   * Optional secondary CTA rendered alongside the primary one. Used by
   * sections like the home Circles CTA where users can either find an
   * existing circle or start a new one.
   */
  secondaryCta: ctaSchema.optional(),
})
export type CtaPanelSection = z.infer<typeof ctaPanelSectionSchema>

const galleryItemSchema = z.object({
  image: mediaRefSchema,
  caption: z.string().min(1).optional(),
  /**
   * Free-form date string. ISO 8601 is preferred when callers need to compare
   * or sort, but gallery captions often want abbreviated forms ("FEB 14").
   */
  date: z.union([isoDateTimeSchema, z.string().min(1)]).optional(),
})

export const gallerySectionSchema = z.object({
  componentType: z.literal('gallery'),
  key: sectionKeySchema,
  items: z.array(galleryItemSchema).min(1),
})
export type GallerySection = z.infer<typeof gallerySectionSchema>

const techStackPillarSchema = z.object({
  id: z.enum(['storage', 'messaging', 'blockchain', 'userModules']),
  title: z.string().min(1),
  body: z.string().min(1),
  href: linkHrefSchema,
  details: z
    .array(
      z.object({
        title: z.string().min(1),
        body: z.string().min(1),
      })
    )
    .optional(),
})

const homeCtaLinkSchema = z.object({
  label: z.string().min(1),
  href: linkHrefSchema,
  variant: z.enum(['primary', 'secondary']).optional(),
})

const techStackArchitectureSchema = z.object({
  eyebrow: z.string().min(1).optional(),
  title: z.string().min(1),
  body: z.array(z.string().min(1)).min(1),
  cta: ctaSchema.optional(),
  image: mediaRefSchema,
})

const techStackBasecampSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1).optional(),
  href: linkHrefSchema,
  cta: ctaSchema.optional(),
})

export const techStackOverviewSectionSchema = z.object({
  componentType: z.literal('techStackOverview'),
  key: sectionKeySchema,
  /**
   * Optional small label rendered above the title — used by surfaces that
   * combine the techStackOverview with intro copy (e.g. the home page).
   */
  eyebrow: z.string().min(1).optional(),
  /** Optional section-level title. The /technology-stack page itself shows
   * the title in a separate hero, so it's not required there. */
  title: z.string().min(1).optional(),
  /** Optional section-level CTA (e.g. "See the Stack"). */
  cta: ctaSchema.optional(),
  /** Optional explicit CTA list rendered by the home overview component. */
  ctas: z.array(homeCtaLinkSchema).optional(),
  architecture: techStackArchitectureSchema.optional(),
  basecamp: techStackBasecampSchema.optional(),
  pillars: z.array(techStackPillarSchema).length(4),
  networkingTitle: z.string().min(1),
  networkingDescription: z.string().min(1).optional(),
  foundationTitle: z.string().min(1),
  foundationDescription: z.string().min(1).optional(),
  /**
   * Labels for the TechStackExplorer heading + body copy.
   * Optional so existing techStackOverview consumers (home, basecamp,
   * tech-stack detail pages) are unaffected.
   */
  explorer: z
    .object({
      titleLine1: z.string().min(1),
      titleLine2: z.string().min(1),
      body: z.string().min(1),
    })
    .optional(),
})
export type TechStackOverviewSection = z.infer<
  typeof techStackOverviewSectionSchema
>

/**
 * Marketing slogan / annotated-text section: a title with a highlighted
 * leading word (accent color), followed by an optional multi-paragraph body
 * and optional CTA. Common Logos design pattern that appears on the home
 * page (Mountain, Parallel Society headline) and the technology-stack page
 * (Modular by design.).
 *
 * The split between `highlight` and `rest` is data-driven rather than
 * derived by string matching so editors can change either independently
 * without component refactors.
 */
export const featuredTextSectionSchema = z.object({
  componentType: z.literal('featuredText'),
  key: sectionKeySchema,
  eyebrow: z.string().min(1).optional(),
  /** Title rendered as a highlighted leading phrase + plain trailing phrase. */
  title: z.object({
    highlight: z.string().min(1),
    rest: z.string().min(1),
  }),
  /** Optional multi-paragraph body. Each entry renders as its own <p>. */
  body: z.array(z.string().min(1)).optional(),
  cta: ctaSchema.optional(),
  /** Optional secondary CTA — used by sections like home Circles CTA where
   * users can pick between two related actions. */
  secondaryCta: ctaSchema.optional(),
  image: mediaRefSchema.optional(),
})
export type FeaturedTextSection = z.infer<typeof featuredTextSectionSchema>

// ---------------------------------------------------------------------------
// Home-specific marketing sections
//
// These mirror the exact named fields their home components render. They are
// bespoke (like techStackOverviewSection) because the copy uses named slots
// and mobile-specific variants that do not map onto the generic section types.
// ---------------------------------------------------------------------------

const homeSocialProofStatSchema = z.object({
  label: z.string().min(1),
  body: z.string().min(1),
})

export const homeSocialProofSectionSchema = z.object({
  componentType: z.literal('homeSocialProof'),
  key: sectionKeySchema,
  headline1: z.string().min(1),
  headline2: z.string().min(1),
  manifestoCta: z.string().min(1),
  contributions: homeSocialProofStatSchema,
  nodeOperators: homeSocialProofStatSchema,
  circles: homeSocialProofStatSchema,
  winnableIssues: homeSocialProofStatSchema,
})
export type HomeSocialProofSection = z.infer<typeof homeSocialProofSectionSchema>

const choosePathItemSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1),
})

export const homeChoosePathSectionSchema = z.object({
  componentType: z.literal('homeChoosePath'),
  key: sectionKeySchema,
  title: z.string().min(1),
  kicker: z.string().min(1),
  body: z.string().min(1),
  build: choosePathItemSchema,
  operate: choosePathItemSchema,
  activism: choosePathItemSchema,
})
export type HomeChoosePathSection = z.infer<typeof homeChoosePathSectionSchema>

export const homeDecideSectionSchema = z.object({
  componentType: z.literal('homeDecide'),
  key: sectionKeySchema,
  headline: z.string().min(1),
  headline2: z.string().min(1),
  headline3: z.string().min(1),
  /** Four desktop layout fragments rendered as separate spans. */
  bodyParts: z.array(z.string().min(1)).length(4),
})
export type HomeDecideSection = z.infer<typeof homeDecideSectionSchema>

export const homeStartBuildingSectionSchema = z.object({
  componentType: z.literal('homeStartBuilding'),
  key: sectionKeySchema,
  title: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1),
  cardCta: z.string().min(1),
  lambdaPrize: z.string().min(1),
  rfps: z.string().min(1),
  ideas: z.string().min(1),
  docs: z.string().min(1),
})
export type HomeStartBuildingSection = z.infer<typeof homeStartBuildingSectionSchema>

const aboutProblemSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  body: z.string().min(1),
  facts: z.array(z.string().min(1)).min(1),
})

export const homeAboutSectionSchema = z.object({
  componentType: z.literal('homeAbout'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  headingMobile: z.string().min(1),
  problems: z.object({
    debt: aboutProblemSchema,
    surveillance: aboutProblemSchema,
    corruption: aboutProblemSchema,
    stagnation: aboutProblemSchema,
  }),
})
export type HomeAboutSection = z.infer<typeof homeAboutSectionSchema>

const useCaseCardSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
})

export const homeUseCasesSectionSchema = z.object({
  componentType: z.literal('homeUseCases'),
  key: sectionKeySchema,
  eyebrow: z.string().min(1),
  headline: z.string().min(1),
  headlineMobile: z.string().min(1),
  /** Rich text with a single `<lambdaPrize>…</lambdaPrize>` link span. */
  lambda: z.string().min(1),
  lambdaMobile: z.string().min(1),
  secure: useCaseCardSchema,
  money: useCaseCardSchema,
  archives: useCaseCardSchema,
  donations: useCaseCardSchema,
})
export type HomeUseCasesSection = z.infer<typeof homeUseCasesSectionSchema>

export const homeBuilderPortalSectionSchema = z.object({
  componentType: z.literal('homeBuilderPortal'),
  key: sectionKeySchema,
  title: z.string().min(1),
  description: z.string().min(1),
  cta: z.string().min(1),
  featureChat: z.string().min(1),
  featureNode: z.string().min(1),
  featureTransactions: z.string().min(1),
})
export type HomeBuilderPortalSection = z.infer<typeof homeBuilderPortalSectionSchema>

// ---------------------------------------------------------------------------
// Page-copy sections for get-started and movement (one blob section per page;
// shape mirrors the former messages.pages.<route> tree minus title/description)
// ---------------------------------------------------------------------------

const gsItemSchema = z.object({ title: z.string().min(1), body: z.string().min(1).optional() })

export const getStartedCopySectionSchema = z.object({
  componentType: z.literal('getStartedCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  intro: z.string().min(1),
  sections: z.object({
    install: z.object({
      number: z.string().min(1), heading: z.string().min(1), cardTitle: z.string().min(1),
      body: z.string().min(1), cta: z.string().min(1), imageAlt: z.string().min(1),
    }),
    docs: z.object({
      number: z.string().min(1), heading: z.string().min(1),
      items: z.record(gsItemSchema),
      viewDocsCta: z.string().min(1), learnMoreCta: z.string().min(1),
      atomicSwapsCta: z.string().min(1), multisigCta: z.string().min(1),
    }),
    community: z.object({
      number: z.string().min(1), heading: z.string().min(1), cta: z.string().min(1),
      items: z.record(z.string().min(1)),
    }),
    build: z.object({
      number: z.string().min(1), heading: z.string().min(1), cta: z.string().min(1),
      nodeCta: z.string().min(1), messagingCta: z.string().min(1), deployCta: z.string().min(1),
      tryItOutCta: z.string().min(1), scaffoldCta: z.string().min(1),
      items: z.record(gsItemSchema),
    }),
  }),
})
export type GetStartedCopySection = z.infer<typeof getStartedCopySectionSchema>

const mvCtaGroup = z.object({ title: z.string().min(1), body: z.string().min(1), cta: z.string().min(1) })

export const movementCopySectionSchema = z.object({
  componentType: z.literal('movementCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  hero: z.object({ title: z.string().min(1), kicker: z.string().min(1), body: z.string().min(1), primaryCta: z.string().min(1), secondaryCta: z.string().min(1) }),
  intro: z.object({ titleLine1: z.string().min(1), titleLine2: z.string().min(1), body: z.string().min(1) }),
  actions: z.object({ activism: mvCtaGroup, coalition: mvCtaGroup, building: mvCtaGroup }),
  campaign: z.object({ eyebrow: z.string().min(1), kicker: z.string().min(1), title: z.string().min(1), body: z.string().min(1), primaryCta: z.string().min(1), secondaryCta: z.string().min(1), tertiaryCta: z.string().min(1) }),
  find: z.object({ title: z.string().min(1), body: z.string().min(1), cta: z.string().min(1) }),
  activismSection: z.object({
    title: z.string().min(1), body: z.string().min(1), cta: z.string().min(1),
  }),
  events: z.object({
    title: z.string().min(1), body: z.string().min(1), cta: z.string().min(1),
    day1: z.object({ date: z.string().min(1), weekday: z.string().min(1) }),
    day2: z.object({ date: z.string().min(1), weekday: z.string().min(1) }),
    day3: z.object({ date: z.string().min(1), weekday: z.string().min(1) }),
    card: z.object({ title: z.string().min(1), time: z.string().min(1), timezone: z.string().min(1), location: z.string().min(1), hosts: z.string().min(1) }),
  }),
  involved: z.object({ title: z.string().min(1), body: z.string().min(1), primaryCta: z.string().min(1), secondaryCta: z.string().min(1) }),
  coalition: z.object({ title: z.string().min(1), body: z.string().min(1), cta: z.string().min(1) }),
  builder: z.object({
    title: z.string().min(1), body: z.string().min(1), primaryCta: z.string().min(1), secondaryCta: z.string().min(1),
    feature: z.object({ city: z.string().min(1), title: z.string().min(1), cta: z.string().min(1) }),
    details: z.object({
      problem: z.object({ label: z.string().min(1), body: z.string().min(1) }),
      solution: z.object({ label: z.string().min(1), body: z.string().min(1) }),
      stack: z.object({ label: z.string().min(1), body: z.string().min(1) }),
    }),
  }),
  resources: z.object({
    titleLine1: z.string().min(1), titleLine2: z.string().min(1), body: z.string().min(1), cta: z.string().min(1),
    rows: z.record(z.object({ number: z.string().min(1), title: z.string().min(1), body: z.string().min(1), cta: z.string().min(1) })),
  }),
})
export type MovementCopySection = z.infer<typeof movementCopySectionSchema>

export const bookCopySectionSchema = z.object({
  componentType: z.literal('bookCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
})
export type BookCopySection = z.infer<typeof bookCopySectionSchema>

export const brandKitCopySectionSchema = z.object({
  componentType: z.literal('brandKitCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  intro: z.string().min(1),
  downloads: z.object({
    brandMarksLabel: z.string().min(1),
    brandMarksHref: z.string().min(1),
    guidelinesSection: z.string().min(1),
    guidelinesLabel: z.string().min(1),
    guidelinesHref: z.string().min(1),
  }),
})
export type BrandKitCopySection = z.infer<typeof brandKitCopySectionSchema>

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
export type NodeProgrammeCopySection = z.infer<typeof nodeProgrammeCopySectionSchema>

const lambdaPrizeRowSchema = z.object({
  label: z.string().min(1),
  body: z.string().min(1),
})

const lambdaPrizeSupportRowSchema = z.object({
  label: z.string().min(1),
  body: z.string().min(1),
  action: z.string().min(1),
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
    rows: z.array(lambdaPrizeSupportRowSchema).min(1),
  }),
})
export type LambdaPrizeCopySection = z.infer<typeof lambdaPrizeCopySectionSchema>

// ---------------------------------------------------------------------------
// Media page copy section (mirrors pages.blog minus title/description)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Podcast page copy section (mirrors pages.podcast minus title/description,
// plus podcasts.cta from pages.blog.podcasts for shared cross-reference)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Logos Broadcast Network page copy section (mirrors pages.logosBroadcastNetwork
// minus title/description)
// ---------------------------------------------------------------------------

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

/**
 * Escape hatch for one-off sections. The `payload` is validated against the
 * Zod schema registered for `customSchemaId` at load time (see
 * `./custom-sections.ts`), not at parse time.
 */
export const customSectionSchema = z.object({
  componentType: z.literal('custom'),
  key: sectionKeySchema,
  customSchemaId: z.string().min(1),
  payload: z.unknown(),
})
export type CustomSection = z.infer<typeof customSectionSchema>

// ---------------------------------------------------------------------------
// PageSection discriminated union
// ---------------------------------------------------------------------------

export const pageSectionSchema = z.discriminatedUnion('componentType', [
  heroSectionSchema,
  richTextSectionSchema,
  cardGridSectionSchema,
  tableSectionSchema,
  giantSwitchSectionSchema,
  relatedArticlesSectionSchema,
  ctaPanelSectionSchema,
  gallerySectionSchema,
  techStackOverviewSectionSchema,
  featuredTextSectionSchema,
  homeSocialProofSectionSchema,
  homeChoosePathSectionSchema,
  homeDecideSectionSchema,
  homeStartBuildingSectionSchema,
  homeAboutSectionSchema,
  homeUseCasesSectionSchema,
  homeBuilderPortalSectionSchema,
  getStartedCopySectionSchema,
  movementCopySectionSchema,
  bookCopySectionSchema,
  brandKitCopySectionSchema,
  researchCopySectionSchema,
  nodeProgrammeCopySectionSchema,
  lambdaPrizeCopySectionSchema,
  manifestoCopySectionSchema,
  mediaCopySectionSchema,
  podcastCopySectionSchema,
  broadcastCopySectionSchema,
  customSectionSchema,
])
export type PageSection = z.infer<typeof pageSectionSchema>

// ---------------------------------------------------------------------------
// PageCopy
// ---------------------------------------------------------------------------

export const pageCopySchema = z.object({
  schemaVersion: schemaVersion(1),
  language: languageSchema,
  route: routePathSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  heading: z.string().min(1).optional(),
  seo: pageSeoSchema.optional(),
  sections: z.array(pageSectionSchema).default([]),
})
export type PageCopy = z.infer<typeof pageCopySchema>
