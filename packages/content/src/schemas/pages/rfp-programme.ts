import { z } from 'zod'

import { linkHrefSchema, mediaRefSchema } from '../common'
import { sectionKeySchema } from './shared'

const text = z.string().min(1)
const link = z.object({ label: text, href: linkHrefSchema })
const section = z.object({ eyebrow: text, heading: text, body: text })
const numberedSection = z.object({
  eyebrow: text,
  heading: text,
  items: z.array(text).min(1),
})

export const rfpProgrammeCopySectionSchema = z.object({
  componentType: z.literal('rfpProgrammeCopy'),
  key: sectionKeySchema,
  hero: z.object({
    breadcrumb: link,
    breadcrumbCurrent: text,
    title: text,
    heading: text,
    jumpLinks: z.array(link).min(1),
    primaryCta: link,
    secondaryCta: link,
    image: mediaRefSchema,
    caption: text,
    publishedLabel: text,
    stats: z.array(z.object({ label: text, value: text })).length(3),
    statusHeading: text,
    notifyCta: link,
  }),
  howItWorks: section.extend({
    kicker: text,
    steps: z.array(z.object({ title: text, body: text })).length(5),
    milestones: z.object({
      heading: text,
      body: z.array(text).length(2),
      cta: link,
      eyebrow: text,
      tag: text,
      payout: text,
      optional: text,
      rows: z
        .array(z.object({ title: text, body: text, duration: text }))
        .length(4),
      footnote: text,
    }),
  }),
  tiers: section.extend({
    kicker: text,
    tag: text,
    examplesLabel: text,
    items: z
      .array(z.object({ size: text, duration: text, examples: text }))
      .length(4),
  }),
  listing: section.extend({
    thesisCta: link,
    filters: z.object({ open: text, closed: text, all: text }),
    statuses: z.object({ open: text, upcoming: text, closed: text }),
    empty: text,
    moreLabel: text,
    learnMore: text,
    submitCta: link,
    githubCta: link,
    featured: z
      .array(
        z.object({ id: text, title: text, image: mediaRefSchema, body: text })
      )
      .length(3),
  }),
  deliverables: numberedSection.extend({ body: text }),
  applicants: z.object({
    eyebrow: text,
    heading: text,
    body: z.array(text).length(2),
    categoriesLabel: text,
    categories: z.array(text).min(1),
    image: mediaRefSchema,
    caption: text,
  }),
  terms: numberedSection.extend({ kicker: text, cta: link }),
  after: section.extend({ cta: link, image: mediaRefSchema, caption: text }),
  finalCta: z.object({ heading: text, primaryCta: link, secondaryCta: link }),
})

export interface RfpProgrammeCopySection extends z.infer<
  typeof rfpProgrammeCopySectionSchema
> {
  componentType: 'rfpProgrammeCopy'
}
