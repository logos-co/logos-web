import { z } from 'zod'

import { linkHrefSchema, mediaRefSchema } from '../common'
import { sectionKeySchema } from './shared'

const text = z.string().min(1)
const link = z.object({ label: text, href: linkHrefSchema })
const row = z.object({ title: text, body: text })
const sectionIntro = z.object({ eyebrow: text, heading: text })

export const lambdaPrizeCopySectionSchema = z.object({
  componentType: z.literal('lambdaPrizeCopy'),
  key: sectionKeySchema,
  hero: z.object({
    breadcrumb: link,
    breadcrumbCurrent: text,
    title: text,
    heading: text,
    body: text,
    primaryCta: link,
    secondaryCta: link,
    jumpLinks: z.array(link).min(1),
    image: mediaRefSchema,
    stats: z
      .array(
        z.object({
          id: z.enum(['open', 'total', 'largest', 'awarded']),
          value: text,
          label: text,
        })
      )
      .length(4),
  }),
  featured: sectionIntro.extend({ body: text, cta: link }),
  prizes: z
    .array(
      z.object({
        id: text,
        status: z.enum(['open', 'coming-soon']),
        statusLabel: text,
        title: text,
        body: text,
        amount: text,
        cta: link.optional(),
        featured: z.object({ image: mediaRefSchema, body: text }).optional(),
      })
    )
    .min(1),
  howItWorks: sectionIntro.extend({
    steps: z.array(row.extend({ number: text })).min(1),
    requirements: sectionIntro.extend({
      mobileHeading: text,
      cards: z
        .array(
          row.extend({
            eyebrow: text,
            metrics: z.array(z.object({ value: text, label: text })).optional(),
          })
        )
        .min(1),
      footnote: text,
    }),
  }),
  rules: sectionIntro.extend({
    body: text,
    image: mediaRefSchema,
    rows: z.array(row).min(1),
    cta: link,
  }),
  openPrizes: sectionIntro.extend({ body: text, cta: link }),
  ownership: z.object({
    eyebrow: text,
    lines: z
      .array(z.object({ before: text, image: mediaRefSchema, after: text }))
      .length(2),
    body: text,
    nextRound: row,
  }),
  rewarded: sectionIntro.extend({
    mobileHeading: text,
    body: text,
    cta: link,
    solutions: z
      .array(z.object({ id: text, title: text, author: text, cta: link }))
      .min(1),
  }),
  resources: z.object({
    heading: text,
    body: text,
    items: z.array(z.object({ number: text, title: text, cta: link })).min(1),
    rfp: z.object({ label: text, body: text, mobile: row, cta: link }),
  }),
  finalCta: z.object({ heading: text, primaryCta: link, secondaryCta: link }),
})

export interface LambdaPrizeCopySection extends z.infer<
  typeof lambdaPrizeCopySectionSchema
> {
  componentType: 'lambdaPrizeCopy'
}

export type LambdaPrize = LambdaPrizeCopySection['prizes'][number]
