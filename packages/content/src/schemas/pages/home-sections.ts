import { z } from 'zod'

import { sectionKeySchema } from './shared'

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
export type HomeSocialProofSection = z.infer<
  typeof homeSocialProofSectionSchema
>

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
export type HomeChoosePathSection = z.infer<
  typeof homeChoosePathSectionSchema
>

export const homeDecideSectionSchema = z.object({
  componentType: z.literal('homeDecide'),
  key: sectionKeySchema,
  headline: z.string().min(1),
  headline2: z.string().min(1),
  headline3: z.string().min(1),
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
export type HomeStartBuildingSection = z.infer<
  typeof homeStartBuildingSectionSchema
>

const aboutProblemSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  body: z.string().min(1),
  facts: z.array(z.string().min(1)).min(1),
  factLinks: z
    .array(
      z.object({
        index: z.number().int().nonnegative(),
        label: z.string().min(1),
        href: z.string().url(),
      })
    )
    .optional(),
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
export type HomeBuilderPortalSection = z.infer<
  typeof homeBuilderPortalSectionSchema
>
