import { z } from 'zod'

import { linkHrefSchema, mediaRefSchema } from '../common'
import { sectionKeySchema } from './shared'

const prifiCtaSchema = z.object({
  label: z.string().min(1),
  href: linkHrefSchema,
})

const prifiStatSchema = z.object({
  value: z.string().min(1),
  note: z.string().min(1),
})

const prifiChainLinkSchema = z.object({
  label: z.string().min(1),
  body: z.string().min(1),
  exposes: z.string().min(1),
  tools: z.string().min(1),
  threat: z.string().min(1),
  stats: z.tuple([
    z.array(prifiStatSchema).min(1),
    z.array(prifiStatSchema).min(1),
  ]),
  graph: mediaRefSchema.extend({ tall: z.boolean() }),
})

export const prifiCopySectionSchema = z.object({
  componentType: z.literal('prifiCopy'),
  key: sectionKeySchema,
  hero: z.object({
    heading: z.tuple([z.string().min(1), z.string().min(1)]),
    body: z.array(z.string().min(1)).min(1),
    primaryCta: prifiCtaSchema,
    secondaryCta: prifiCtaSchema,
  }),
  supplyChain: z.object({
    heading: z.string().min(1),
    tabListLabel: z.string().min(1),
    lead: z.string().min(1),
    note: z.string().min(1),
    factLabels: z.object({
      exposes: z.string().min(1),
      tools: z.string().min(1),
      threat: z.string().min(1),
    }),
    statLabels: z.tuple([z.string().min(1), z.string().min(1)]),
    links: z.array(prifiChainLinkSchema).length(7),
  }),
  exploitBand: z.object({
    lines: z.array(z.string().min(1)).min(1),
    conclusion: z.string().min(1),
  }),
  hazards: z.object({
    heading: z.string().min(1),
    classes: z
      .array(
        z.object({
          name: z.string().min(1),
          who: z.string().min(1),
          risk: z.string().min(1),
          bound: z.string().min(1),
        })
      )
      .min(1),
  }),
  protection: z.object({
    heading: z.string().min(1),
    lead: z.string().min(1),
    body: z.tuple([z.string().min(1), z.string().min(1)]),
    matrix: z.object({
      columns: z.tuple([z.string().min(1), z.string().min(1)]),
      rows: z
        .array(
          z.object({
            hazard: z.string().min(1),
            cells: z.tuple([
              z.object({
                verdict: z.string().min(1),
                reason: z.string().min(1),
              }),
              z.object({
                verdict: z.string().min(1),
                reason: z.string().min(1),
              }),
            ]),
          })
        )
        .min(1),
    }),
  }),
  transparency: z.object({
    heading: z.string().min(1),
    body: z.string().min(1),
  }),
  credibility: z
    .array(
      z.object({
        title: z.string().min(1),
        body: z.tuple([z.string().min(1), z.string().min(1)]),
        note: z.string().min(1),
        image: z.string().min(1),
      })
    )
    .length(2),
  imperativeCommitments: z.object({
    heading: z.string().min(1),
    body: z.string().min(1),
  }),
  logosStack: z.object({
    heading: z.string().min(1),
    body: z.string().min(1),
    columns: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
    rows: z
      .array(
        z.object({
          component: z.string().min(1),
          role: z.string().min(1),
          covers: z.string().min(1),
        })
      )
      .min(1),
  }),
  institutions: z.object({
    heading: z.string().min(1),
    body: z.tuple([z.string().min(1), z.string().min(1)]),
  }),
  deeperDives: z.object({
    heading: z.string().min(1),
    cards: z
      .array(
        z.object({
          title: z.string().min(1),
          subtitle: z.string().min(1),
          body: z.string().min(1),
          cta: z.string().min(1),
          href: linkHrefSchema,
        })
      )
      .min(1),
  }),
})

export type PrifiCopySection = z.infer<typeof prifiCopySectionSchema>
