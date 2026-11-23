import { cache } from 'react'

import { ROUTES } from '@/constants/routes'
import { githubMarkdownDirectory } from '@/lib/github-markdown'
import type { RfpListItem } from '@/lib/rfp-types'
import { parseYamlFrontMatter } from '@/lib/yaml-front-matter'

/**
 * Build-time RFP source. RFPs live as markdown in the public GitHub repo
 * `logos-co/rfp` (one file per RFP under `RFPs/`). This module fetches and
 * parses them at build time so the `/rfp` listing and the
 * `[slug]` detail pages render from a single live source — mirroring
 * build.logos.co's `pages/rfp.tsx`, but server-side instead of client-side.
 *
 * Fields GitHub doesn't carry (reward, image, tags) are intentionally absent;
 * the listing UI hides whatever is missing.
 */

const rfpDirectory = githubMarkdownDirectory('logos-co/rfp', 'RFPs')

/** Where the detail-page "Apply" CTA points (GitHub issue template). */
export const RFP_APPLY_URL =
  'https://github.com/logos-co/rfp/issues/new?template=proposal.yml'

/** The RFP repo, linked from the listing header and detail footer. */
export const RFP_REPO_URL = 'https://github.com/logos-co/rfp'

export type GithubRfp = RfpListItem & {
  /** RFP identifier, e.g. `RFP-001`. */
  number: string
  category: string
  status: string
  tier: string
  /** Canonical GitHub `blob` URL for this RFP's markdown file. */
  githubUrl: string
  /** Full markdown body, rendered verbatim on the detail page. */
  rawMarkdown: string
}

export const fetchRfpMarkdownEntryForTest = rfpDirectory.read
export const fetchRfpListingForTest = rfpDirectory.list
export const parseJsDelivrRfpListingForTest = rfpDirectory.parseListing

/** `RFP-001-admin-authority-lib.md` → `admin-authority-lib`. */
const toSlug = (filename: string, fallback: string): string => {
  const base = filename.replace(/\.md$/i, '').replace(/^RFP-\d+[-_\s]*/i, '')
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback.toLowerCase()
}

/** Matches the URL target of a markdown inline link/image: `](target)`. */
const MARKDOWN_LINK_TARGET = /\]\(\s*(<[^>]+>|[^)\s]+)\s*\)/g

const isAbsoluteOrAnchor = (href: string): boolean =>
  /^(https?:\/\/|\/|#|mailto:)/i.test(href)

/**
 * Rewrites repo-relative markdown links so RFP detail pages don't 404. Upstream
 * RFP files cross-reference each other with paths relative to the repo's
 * `RFPs/` directory (e.g. `./RFP-008-lending-borrowing-protocol.md`), which the
 * browser would otherwise resolve against the page URL and 404.
 *
 * - `RFP-NNN-*.md` references become the internal detail route
 *   (`/rfp/<slug>`), using the same slug the pages are built with.
 * - Other repo-relative `.md` links (e.g. `../appendix/…`) have no site page, so
 *   they resolve to their absolute GitHub URL (anchors preserved).
 * - Absolute, external, and anchor links are left untouched.
 *
 * `fileHtmlUrl` is the GitHub `blob` URL of the file being parsed; it anchors
 * the resolution of the remaining relative links.
 */
export const rewriteRfpMarkdownLinks = (
  markdown: string,
  fileHtmlUrl: string
): string =>
  markdown.replace(MARKDOWN_LINK_TARGET, (match, rawTarget: string) => {
    const href = rawTarget.replace(/^<|>$/g, '')
    if (isAbsoluteOrAnchor(href)) return match

    const [path] = href.split('#')
    if (!/\.md$/i.test(path)) return match

    const filename = path.split('/').pop() ?? ''
    if (/^RFP-\d+/i.test(filename)) {
      return `](${ROUTES.rfps}/${toSlug(filename, filename)})`
    }

    try {
      return `](${new URL(href, fileHtmlUrl).href})`
    } catch {
      return match
    }
  })

const firstMatch = (raw: string, patterns: RegExp[]): string | undefined => {
  for (const pattern of patterns) {
    const value = raw.match(pattern)?.[1]?.replace(/[`*]/g, '').trim()
    if (value) return value
  }
  return undefined
}

/**
 * Upper bound for an RFP summary. It is rendered both as the page's meta
 * description and as the card blurb, so it targets the ~155 characters Google
 * shows before truncating a description itself.
 */
const SUMMARY_MAX_LENGTH = 155

/**
 * Flattens the markdown that survives into a summary. Without this the raw
 * source leaks into `<meta name="description">` — `/rfp/
 * curated-lending-vaults` shipped a description ending
 * `delivered by [RFP-008](./RFP-008-lending-borr`.
 */
const stripMarkdown = (text: string): string =>
  text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → their label
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(?=\S)(.*?\S)\1/g, '$2') // italic
    .replace(/^>\s*/gm, '') // blockquote markers
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Cuts to the last whole word inside `max`, so a summary never ends mid-word.
 */
const truncateAtWord = (text: string, max: number): string => {
  if (text.length <= max) return text
  const clipped = text.slice(0, max)
  const lastSpace = clipped.lastIndexOf(' ')
  const trimmed = (
    lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped
  ).replace(/[\s,;:.\-—]+$/, '')
  return `${trimmed}…`
}

const extractSummary = (raw: string): string => {
  const overview = raw.match(/##\s*(?:🧭\s*)?Overview\s*\n+([\s\S]*?)(?=\n##)/i)
  const source = overview
    ? overview[1]
    : raw
        .split('\n')
        .filter(
          (line) =>
            line.trim() &&
            !line.startsWith('#') &&
            !line.startsWith('|') &&
            !line.startsWith('---') &&
            !line.startsWith('**')
        )
        .slice(0, 3)
        .join(' ')

  return truncateAtWord(stripMarkdown(source), SUMMARY_MAX_LENGTH)
}

export const extractSummaryForTest = extractSummary

/** Trimmed non-empty string from an untyped frontmatter value, else undefined. */
const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

/**
 * Frontmatter parse that never throws. Upstream RFP files occasionally carry
 * invalid YAML (e.g. an unquoted colon in `title:`). For invalid YAML or an
 * unsupported frontmatter language, strip the frontmatter block
 * and parse the body only, so the markdown-heuristic path (`# heading`,
 * `**Field**` lines) still populates the listing — matching the documented
 * predates-frontmatter fallback.
 */
const safeMatter = (
  raw: string,
  filename: string
): { data: Record<string, unknown>; content: string } => {
  try {
    return parseYamlFrontMatter(raw)
  } catch (error) {
    console.error(
      `Invalid frontmatter in ${filename}, parsing body only:`,
      error
    )
    const body = raw.replace(
      /^\uFEFF?---(?!-)[^\n]*\n(?:[\s\S]*?\n)?---[ \t]*(?:\r?\n|$)/,
      ''
    )
    return { data: {}, content: body }
  }
}

/**
 * Parses one RFP markdown file. RFP files carry YAML frontmatter
 * (`id`, `title`, `tier`, `funding`, `status`, `category`) followed by the
 * body. The parser strips the frontmatter so it never renders as text, and
 * its parsed fields are preferred over markdown heuristics; the `**Field**`
 * regexes remain as a fallback for any file that predates frontmatter.
 */
const parseRfpMarkdown = (
  raw: string,
  filename: string,
  htmlUrl: string
): GithubRfp | null => {
  const number = filename.match(/^(RFP-\d+)/)?.[1]
  if (!number || number === 'RFP-000') return null

  const { data, content } = safeMatter(raw, filename)

  const headingTitle = content
    .match(/^#\s+(.+)/m)?.[1]
    ?.replace(/^RFP-\d+[:\s\-—]+/, '')
    .trim()
  const title = str(data.title) ?? headingTitle ?? filename

  const status =
    str(data.status) ??
    firstMatch(content, [/\*\*Status\*\*[:\s]*(.+)/i]) ??
    'open'
  const category =
    str(data.category) ?? firstMatch(content, [/\*\*Category\*\*[:\s]*(.+)/i])
  const tier =
    str(data.tier) ?? firstMatch(content, [/\*\*Tier\*\*[:\s]*(.+)/i])

  return {
    number,
    slug: toSlug(filename, number),
    title,
    category: category ?? '',
    summary: extractSummary(content),
    status,
    tier: tier ?? '',
    githubUrl: htmlUrl,
    rawMarkdown: rewriteRfpMarkdownLinks(content.trim(), htmlUrl),
  }
}

/** Raised when the public RFP source is unreachable or only partly readable. */
export class RfpSourceError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'RfpSourceError'
  }
}

/**
 * Fetches and parses every published RFP from the GitHub repo, sorted by RFP
 * number. Drafts and the `RFP-000` template are excluded. Wrapped in React
 * `cache()` so repeated calls within a build pass dedupe; Next's fetch Data
 * Cache dedupes the underlying network requests across passes.
 *
 * Throws `RfpSourceError` if neither GitHub nor its public mirror can provide
 * the listing or any individual RFP file. Every caller -- sitemap,
 * `generateStaticParams`, the listing page -- uses this, so a source outage
 * fails the build loudly instead of exporting a site whose RFP detail routes
 * silently 404 (there is no runtime fallback under `output: 'export'`).
 */
export const fetchGithubRfps = cache(async (): Promise<GithubRfp[]> => {
  const entries = await rfpDirectory.list().catch((error: Error) => {
    throw new RfpSourceError(error.message, { cause: error })
  })

  const mdFiles = entries.filter(
    (entry) =>
      entry.name.endsWith('.md') &&
      entry.name.startsWith('RFP-') &&
      !entry.name.startsWith('RFP-000') &&
      entry.download_url
  )

  const parsed = await Promise.all(
    mdFiles.map(async (entry): Promise<GithubRfp | null> => {
      let raw: string | null
      try {
        raw = await rfpDirectory.read(entry)
      } catch (error) {
        throw new RfpSourceError(`Failed to fetch ${entry.name}`, {
          cause: error,
        })
      }
      if (!raw) throw new RfpSourceError(`Failed to fetch ${entry.name}`)
      return parseRfpMarkdown(raw, entry.name, entry.html_url ?? RFP_REPO_URL)
    })
  )

  return parsed
    .filter((rfp): rfp is GithubRfp => rfp !== null)
    .filter((rfp) => !rfp.status.toLowerCase().includes('draft'))
    .sort((a, b) => a.number.localeCompare(b.number))
})

/** Single-RFP lookup by slug, reusing the cached full fetch. */
export const fetchGithubRfpBySlug = async (
  slug: string
): Promise<GithubRfp | null> => {
  const rfps = await fetchGithubRfps()
  return rfps.find((rfp) => rfp.slug === slug) ?? null
}

/** Strips the leading `# …` heading so the detail header isn't duplicated. */
export const stripLeadingHeading = (raw: string): string =>
  raw.replace(/^\s*#\s+.+(\r?\n)+/, '')
