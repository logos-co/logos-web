import { z } from 'zod'

import { linkHrefSchema, mediaRefSchema } from '../common'
import { sectionKeySchema } from './shared'

const text = z.string().min(1)
const link = z.object({ label: text, href: linkHrefSchema })
const programme = z.object({
  name: text,
  panelTitle: text,
  tag: text,
  availability: text.optional(),
  image: mediaRefSchema,
  intro: text,
  body: text,
  stats: z.array(z.object({ value: text, label: text })).length(3),
  highlight: z.object({ label: text, title: text, detail: text }),
  opportunities: z.array(z.object({ code: text, title: text, detail: text })),
  cta: link,
  comparison: z.array(z.object({ label: text, body: text })).min(1),
  choice: z.object({ title: text, statements: z.array(text).min(1) }),
})

export const developerProgrammesCopySectionSchema = z.object({
  componentType: z.literal('developerProgrammesCopy'),
  key: sectionKeySchema,
  hero: z.object({ eyebrow: text, title: text, subtitle: text, body: text }),
  programmes: z.tuple([
    programme.extend({ id: z.literal('rfp') }),
    programme.extend({ id: z.literal('prize') }),
  ]),
  comparisonHeading: text,
  choiceHeading: text,
  choiceHelp: z.object({ text, cta: link }),
  principles: z.object({
    heading: text,
    items: z.array(z.object({ title: text, body: text })).length(3),
  }),
  statement: z.object({ title: text, body: text, image: mediaRefSchema }),
  resources: z.object({
    heading: text,
    items: z.array(z.object({ title: text, body: text, cta: link })).min(1),
  }),
})

export interface DeveloperProgrammesCopySection extends z.infer<
  typeof developerProgrammesCopySectionSchema
> {
  componentType: 'developerProgrammesCopy'
}

export type DeveloperProgramme =
  DeveloperProgrammesCopySection['programmes'][number]
