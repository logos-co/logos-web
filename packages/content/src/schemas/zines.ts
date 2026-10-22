import { z } from 'zod'
import { languageSchema, schemaVersion, slugSchema } from './common'

export const zineEditionSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  date: z.string().min(1),
  cover: z.string().startsWith('/images/zines/'),
  href: z.string().url().optional(),
  reader: z.boolean(),
})
export type ZineEdition = z.infer<typeof zineEditionSchema>

export const zineCatalogueSchema = z
  .object({
    schemaVersion: schemaVersion(1),
    language: languageSchema,
    title: z.string().min(1),
    description: z.string().min(1),
    editions: z.array(zineEditionSchema).min(1),
  })
  .refine(
    (catalogue) =>
      new Set(catalogue.editions.map((edition) => edition.slug)).size ===
      catalogue.editions.length,
    'Duplicate zine slug'
  )
export type ZineCatalogue = z.infer<typeof zineCatalogueSchema>

export const zineIssueSchema = z
  .object({
    schemaVersion: schemaVersion(1),
    language: languageSchema,
    slug: slugSchema,
    title: z.string().min(1),
    shortTitle: z.string().min(1),
    edition: z.string().min(1),
    description: z.string().min(1),
    pdf: z.string().regex(/^\/zine\/[a-z0-9-]+\.pdf$/),
    trim: z.number().nonnegative(),
    pageCount: z.number().int().min(3),
    pageNumberOffset: z.number().int().min(-1).max(1).optional(),
    pageTitles: z.record(z.string(), z.string().min(1)),
    textLayer: z.boolean().optional(),
    printLayout: z.enum(['pages', 'spreads']).optional(),
    imposedPdf: z
      .string()
      .regex(/^\/zine\/[a-z0-9-]+\.pdf$/)
      .optional(),
    sections: z
      .array(
        z.object({
          title: z.string().min(1),
          entries: z
            .array(
              z.object({
                title: z.string().min(1),
                page: z.number().int().positive(),
                startWord: z.number().int().nonnegative().optional(),
              })
            )
            .min(1),
        })
      )
      .min(1),
  })
  .refine(
    (issue) =>
      issue.sections.every((section) =>
        section.entries.every((entry) => entry.page < issue.pageCount - 1)
      ),
    'Contents page outside issue'
  )
export type ZineIssue = z.infer<typeof zineIssueSchema>

export const zineWordSchema = z.object({
  text: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().positive(),
})
export type ZineWord = z.infer<typeof zineWordSchema>
export const zineBlockSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
})
export type ZineBlock = z.infer<typeof zineBlockSchema>
export const zinePageSchema = z.object({
  number: z.number().int().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
  links: z
    .array(
      z.object({
        href: z.string().regex(/^(https?:\/\/|mailto:)/),
        x: z.number(),
        y: z.number(),
        width: z.number().positive(),
        height: z.number().positive(),
      })
    )
    .optional(),
  words: z.array(zineWordSchema),
  blocks: z.array(zineBlockSchema),
})
export type ZinePage = z.infer<typeof zinePageSchema>
export const zineDocumentSchema = z.object({
  schemaVersion: schemaVersion(1),
  slug: slugSchema,
  sourceHash: z.string(),
  pages: z.array(zinePageSchema).min(3),
})
export type ZineDocument = z.infer<typeof zineDocumentSchema>

export const zinePrintGuideSchema = z.object({
  schemaVersion: schemaVersion(1),
  language: languageSchema,
  steps: z
    .array(z.object({ title: z.string().min(1), body: z.string().min(1) }))
    .min(1),
  shop: z.object({ title: z.string().min(1), body: z.string().min(1) }),
  spreadPrint: z.string().min(1),
})
export type ZinePrintGuide = z.infer<typeof zinePrintGuideSchema>

export const zineTextLayerSchema = z.object({
  sourceHash: z.string(),
  pages: z.array(
    z.object({
      words: z.array(zineWordSchema),
      blocks: z.array(zineBlockSchema),
    })
  ),
})
