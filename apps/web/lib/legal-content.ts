import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import matter from 'gray-matter'
import { z } from 'zod'

/**
 * Loader for markdown-managed legal / info documents (terms, privacy,
 * security, testnet FAQs). Each document lives at
 * `content/legal/<slug>.md` and owns its own SEO metadata via YAML
 * frontmatter, so a document is a single self-contained source of truth.
 *
 * Frontmatter contract:
 *   title       — document <title> for SEO metadata
 *   description — meta description for SEO metadata
 *   heading     — visible page heading rendered above the body
 */

const LEGAL_CONTENT_DIR = join(process.cwd(), 'content', 'legal')

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  heading: z.string().min(1),
})

export type LegalDoc = z.infer<typeof frontmatterSchema> & {
  /** Raw markdown body (frontmatter stripped). */
  body: string
}

/**
 * Read and validate a legal markdown document by slug.
 *
 * @throws if the file is missing, or its frontmatter fails validation.
 */
export function getLegalDoc(slug: string): LegalDoc {
  const filePath = join(LEGAL_CONTENT_DIR, `${slug}.md`)

  let raw: string
  try {
    raw = readFileSync(filePath, 'utf-8')
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`failed to read legal document "${slug}": ${reason}`, {
      cause: error,
    })
  }

  const { data, content } = matter(raw)
  const result = frontmatterSchema.safeParse(data)
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ')
    throw new Error(`invalid frontmatter in legal document "${slug}": ${issues}`)
  }

  const body = content.trim()
  if (body.length === 0) {
    throw new Error(`legal document "${slug}" has no body content`)
  }

  return { ...result.data, body }
}
