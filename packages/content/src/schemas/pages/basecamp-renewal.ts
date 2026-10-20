import { z } from 'zod'

import { ctaSchema, linkHrefSchema } from '../common'
import { sectionKeySchema } from './shared'

const copy = z.string().min(1)
const lines = z.array(copy).min(1)
const link = z.object({ label: copy, href: linkHrefSchema })

export const basecampRenewalSectionSchema = z.object({
  componentType: z.literal('basecampRenewal'),
  key: sectionKeySchema,
  hero: z.object({
    badges: lines,
    title: lines,
    description: copy,
    statement: copy,
    windowTitle: copy,
    install: ctaSchema,
    versions: ctaSchema,
    platforms: z.array(z.object({ label: copy, available: z.boolean() })),
    status: copy,
    windowAlt: copy,
    previewLabel: copy,
    previewTabs: lines.length(4),
    previews: z
      .array(
        z.object({
          title: copy,
          description: copy,
          details: lines,
        })
      )
      .length(3),
  }),
  subnav: z.object({
    useLabel: copy,
    buildLabel: copy,
    useLinks: z.array(link),
    buildLinks: z.array(link),
    install: ctaSchema,
  }),
  about: z.object({
    title: lines,
    paragraphs: z.array(lines),
    stats: z.array(z.object({ value: copy, label: copy })).length(4),
  }),
  how: z.object({
    title: lines,
    intro: copy,
    disclaimer: copy,
    layers: z
      .array(
        z.object({
          title: copy,
          label: copy,
          description: copy,
          highlight: copy.optional(),
        })
      )
      .length(3),
    diagram: z.object({
      title: copy,
      hint: copy,
      apps: lines,
      modules: z.array(z.object({ label: copy, items: lines })),
      networkLabel: copy,
      network: lines,
      runtime: copy,
      flows: z
        .array(
          z.object({
            app: copy,
            path: copy,
            description: copy,
            modules: z.array(copy),
            network: z.number().int().min(0).max(1).nullable(),
          })
        )
        .min(1),
    }),
  }),
  local: z.object({
    title: copy,
    typicalTitle: copy,
    basecampTitle: copy,
    rows: z
      .array(z.object({ label: copy, typical: copy, basecamp: copy }))
      .length(5),
  }),
  run: z.object({
    title: lines,
    description: copy,
    steps: z
      .array(z.object({ label: copy, status: z.string(), title: copy }))
      .length(4),
    playerHint: copy,
    windowAlt: copy,
    nextLabel: copy,
    pinnedHint: copy,
    panels: z
      .array(
        z.object({
          title: copy,
          body: copy,
          detail: copy,
          calloutTitle: copy,
          calloutBody: copy,
        })
      )
      .length(4),
    install: ctaSchema,
    demo: ctaSchema,
  }),
  apps: z.object({
    title: lines,
    description: copy,
    filters: lines,
    cards: z.array(
      z.object({
        initial: copy,
        title: copy,
        description: copy,
        uses: copy,
        category: copy,
        action: ctaSchema,
        guide: ctaSchema,
      })
    ),
    installCard: z.object({
      eyebrow: copy,
      title: lines,
      platforms: copy,
      action: ctaSchema,
    }),
    community: z.object({
      eyebrow: copy,
      title: lines,
      description: copy,
      disclaimer: copy,
      action: ctaSchema,
      cards: z.array(
        z.object({ initial: copy, title: copy, description: copy })
      ),
    }),
  }),
  build: z.object({
    title: lines,
    description: copy,
    docs: ctaSchema,
    tutorials: ctaSchema,
    codeExamples: z
      .array(z.object({ label: copy, comment: copy, commands: lines }))
      .length(3),
    copyLabel: copy,
    copiedLabel: copy,
    programmesTitle: copy,
    programmesDescription: copy,
    programmes: z
      .array(
        z.object({
          eyebrow: copy,
          title: copy,
          description: copy,
          action: ctaSchema,
          image: copy,
        })
      )
      .length(2),
  }),
  started: z.object({
    title: copy,
    install: z.object({
      eyebrow: copy,
      title: copy,
      links: z.array(link),
      platforms: lines,
    }),
    docs: z.object({ eyebrow: copy, title: copy, links: z.array(link) }),
    video: z.object({ eyebrow: copy, title: copy, link }),
  }),
})

export type BasecampRenewalSection = z.infer<
  typeof basecampRenewalSectionSchema
>
