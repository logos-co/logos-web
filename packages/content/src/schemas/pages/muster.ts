import { z } from 'zod'

import { ctaSchema, mediaRefSchema } from '../common'
import { sectionKeySchema } from './shared'

const text = z.string().min(1)
const paragraphs = z.array(text).min(1)
const entry = z.object({ title: text, body: text })
const textSection = z.object({ title: text, body: paragraphs })

const room = textSection
  .extend({ index: text })
  .and(
    z.union([
      z.object({ image: mediaRefSchema }),
      z.object({ placeholder: text }),
    ])
  )

export const musterCopySectionSchema = z.object({
  componentType: z.literal('musterCopy'),
  key: sectionKeySchema,
  hero: z.object({
    brand: text,
    project: text,
    headline: z.tuple([text, text]),
    note: text,
    image: mediaRefSchema,
  }),
  intro: z.object({
    lead: text,
    body: paragraphs,
    ctas: z.tuple([ctaSchema, ctaSchema]),
    image: mediaRefSchema,
    stats: z.array(entry).length(3),
  }),
  basics: z.object({
    room: textSection.extend({ steps: z.array(entry).length(4) }),
    basecamp: textSection.extend({ features: z.array(entry).length(4) }),
    statement: z.tuple([text, text]),
  }),
  architecture: textSection.extend({
    dependencies: z.object({ label: text, nodes: z.array(entry).length(4) }),
    basecamp: z.object({
      label: text,
      musterLabel: text,
      interface: entry,
      core: entry,
      handoffLabel: text,
      wallet: entry,
      app: entry,
    }),
    reach: z.object({ label: text, nodes: z.array(entry).length(3) }),
    caption: text,
  }),
  modules: textSection.extend({
    entries: z.array(entry).length(4),
    image: mediaRefSchema,
  }),
  rooms: textSection.extend({ entries: z.array(room).length(3) }),
  prifi: textSection.extend({
    stages: z.array(text).length(8),
    cards: z.array(entry.extend({ label: text })).length(3),
    cta: ctaSchema,
  }),
  build: z.object({
    title: z.tuple([text, text]),
    body: paragraphs,
    image: mediaRefSchema,
    install: entry.extend({ cta: ctaSchema }),
    cards: z.array(entry.extend({ ctas: z.array(ctaSchema).min(1) })).length(3),
  }),
  closing: z.object({
    lead: text,
    left: z.tuple([text, text]),
    right: z.tuple([text, text]),
    cta: ctaSchema,
    nextLabel: text,
    next: ctaSchema,
  }),
})

export type MusterCopySection = z.infer<typeof musterCopySectionSchema>
