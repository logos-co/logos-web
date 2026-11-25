import { z } from 'zod'

import { ctaSchema, mediaRefSchema } from '../common'
import { sectionKeySchema } from './shared'

const text = z.string().min(1)
const paragraphs = z.array(text).min(1)
const entry = z.object({ title: text, body: text })
const section = z.object({ title: text, body: paragraphs })

export const fieldStationCaseStudyCopySectionSchema = z.object({
  componentType: z.literal('fieldStationCaseStudyCopy'),
  key: sectionKeySchema,
  hero: z.object({ title: text, label: text, image: mediaRefSchema }),
  intro: z.object({
    lead: text,
    body: text,
    installLabel: text,
    fieldStationCta: ctaSchema,
    image: mediaRefSchema,
    stats: z.array(entry).length(3),
  }),
  basics: section.extend({
    image: mediaRefSchema,
    label: text,
    tracks: z.array(entry).length(4),
  }),
  community: section.extend({
    statement: text,
    details: paragraphs,
    images: z.array(mediaRefSchema).length(2),
  }),
  projects: z.object({
    title: text,
    body: text,
    disclaimer: text,
    previousLabel: text,
    nextLabel: text,
    entries: z
      .array(
        z.object({
          title: text,
          lead: text,
          body: text,
          image: mediaRefSchema.optional(),
          imageFit: z.enum(['contain', 'cover']).optional(),
          cta: ctaSchema,
        })
      )
      .length(4),
  }),
  testimonial: z.object({
    image: mediaRefSchema,
    desktopImage: mediaRefSchema,
    quote: text,
    attribution: text,
  }),
  next: z.object({
    title: text,
    entries: z.array(entry.extend({ label: text })).length(3),
  }),
  modules: section.extend({ entries: z.array(entry).length(3) }),
  architecture: section.extend({
    features: z.array(entry).length(2),
    basecamp: text,
    appsLabel: text,
    apps: z.array(entry).length(4),
    zcash: entry,
    modules: z.array(entry).length(3),
    loads: text,
    modulesLabel: text,
    caption: text,
  }),
  build: z.object({
    title: text,
    body: text,
    image: mediaRefSchema,
    cards: z.array(entry.extend({ ctas: z.array(ctaSchema).min(1) })).length(4),
  }),
  closing: z.object({
    left: z.tuple([text, text]),
    right: z.tuple([text, text]),
    body: text,
    disclaimer: text,
    nextLabel: text,
    next: ctaSchema,
  }),
})

export type FieldStationCaseStudyCopySection = z.infer<
  typeof fieldStationCaseStudyCopySectionSchema
>
