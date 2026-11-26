import { z } from 'zod'

import { linkHrefSchema, mediaRefSchema } from '../common'
import { sectionKeySchema } from './shared'

const nodeReferralProgrammeLinkSchema = z.object({
  label: z.string().min(1),
  href: linkHrefSchema,
})

export const nodeReferralProgrammeCopySectionSchema = z.object({
  componentType: z.literal('nodeReferralProgrammeCopy'),
  key: sectionKeySchema,
  hero: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    image: mediaRefSchema,
    discordCta: z.string().min(1),
  }),
  signup: z.object({
    emailLabel: z.string().min(1),
    emailPlaceholder: z.string().min(1),
    submit: z.string().min(1),
    submitting: z.string().min(1),
    invalidEmail: z.string().min(1),
    genericError: z.string().min(1),
    success: z.string().min(1),
    successLink: z.string().min(1),
  }),
  basecamp: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    privacy: z.string().min(1),
    installCta: nodeReferralProgrammeLinkSchema,
    versionsCta: nodeReferralProgrammeLinkSchema,
    guideCta: nodeReferralProgrammeLinkSchema,
    platforms: z.string().min(1),
    versionLabel: z.string().min(1),
    testnetLabel: z.string().min(1),
  }),
  faqs: z.object({
    title: z.string().min(1),
    cta: nodeReferralProgrammeLinkSchema,
    items: z
      .array(
        z.object({
          question: z.string().min(1),
          answer: z
            .array(
              z.object({
                text: z.string().min(1),
                href: linkHrefSchema.optional(),
              })
            )
            .min(1),
        })
      )
      .min(1),
  }),
})
export type NodeReferralProgrammeCopySection = z.infer<
  typeof nodeReferralProgrammeCopySectionSchema
>
