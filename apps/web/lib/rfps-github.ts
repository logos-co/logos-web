import matter from 'gray-matter'
import { cache } from 'react'

import { ROUTES } from '@/constants/routes'
import type { RfpListItem } from '@/lib/rfp-types'

/**
 * Build-time RFP source. RFPs live as markdown in the public GitHub repo
 * `logos-co/rfp` (one file per RFP under `RFPs/`). This module fetches and
 * parses them at build time so the `/builders-hub/rfps` listing and the
 * `[slug]` detail pages render from a single live source — mirroring
 * build.logos.co's `pages/rfp.tsx`, but server-side instead of client-side.
 *
 * Fields GitHub doesn't carry (reward, image, tags) are intentionally absent;
 * the listing UI hides whatever is missing.
 */

const RFP_CONTENTS_URL =
  'https://api.github.com/repos/logos-co/rfp/contents/RFPs'

/** Where the detail-page "Apply" CTA points (GitHub issue template). */
export const RFP_APPLY_URL =
  'https://github.com/logos-co/rfp/issues/new?template=proposal.yml'

/** The RFP repo, linked from the listing header and detail footer. */
export const RFP_REPO_URL = 'https://github.com/logos-co/rfp'

/**
 * GitHub's API rejects unauthenticated requests without a User-Agent. A token
 * (optional) lifts the 60 req/hr unauthenticated rate limit during CI builds.
 */
const githubHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'logos-web-build',
  }
  const token = process.env.GITHUB_TOKEN
  if (token) headers.Authorization = `token ${token}`
  return headers
}

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

type GithubContentEntry = {
  name: string
  download_url: string | null
  html_url: string | null
}

const isContentEntry = (value: unknown): value is GithubContentEntry =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as GithubContentEntry).name === 'string'

/** `RFP-001-admin-authority-lib.md` → `admin-authority-lib`. */
const toSlug = (filename: string, fallback: string): string => {
  const base = filename
    .replace(/\.md$/i, '')
    .replace(/^RFP-\d+[-_\s]*/i, '')
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
 *   (`/builders-hub/rfps/<slug>`), using the same slug the pages are built with.
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

const extractSummary = (raw: string): string => {
  const overview = raw.match(/##\s*(?:🧭\s*)?Overview\s*\n+([\s\S]*?)(?=\n##)/i)
  if (overview) {
    return overview[1]
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join(' ')
      .slice(0, 200)
  }
  const lines = raw
    .split('\n')
    .filter(
      (line) =>
        line.trim() &&
        !line.startsWith('#') &&
        !line.startsWith('|') &&
        !line.startsWith('---') &&
        !line.startsWith('**')
    )
  return lines.slice(0, 3).join(' ').slice(0, 200)
}

/** Trimmed non-empty string from an untyped frontmatter value, else undefined. */
const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

/**
 * Frontmatter parse that never throws. Upstream RFP files occasionally carry
 * invalid YAML (e.g. an unquoted colon in `title:`), which `gray-matter` would
 * throw on. Rather than dropping the whole RFP, we strip the frontmatter block
 * and parse the body only, so the markdown-heuristic path (`# heading`,
 * `**Field**` lines) still populates the listing — matching the documented
 * predates-frontmatter fallback.
 */
const safeMatter = (
  raw: string,
  filename: string
): { data: Record<string, unknown>; content: string } => {
  try {
    return matter(raw)
  } catch (error) {
    console.error(`Invalid frontmatter in ${filename}, parsing body only:`, error)
    const body = raw.replace(/^\uFEFF?\s*---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
    return { data: {}, content: body }
  }
}

/**
 * Parses one RFP markdown file. RFP files carry YAML frontmatter
 * (`id`, `title`, `tier`, `funding`, `status`, `category`) followed by the
 * body. `gray-matter` strips the frontmatter so it never renders as text, and
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
  const tier = str(data.tier) ?? firstMatch(content, [/\*\*Tier\*\*[:\s]*(.+)/i])

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

/**
 * Fetches and parses every published RFP from the GitHub repo, sorted by RFP
 * number. Drafts and the `RFP-000` template are excluded. Wrapped in React
 * `cache()` so repeated calls within a build pass dedupe; Next's fetch Data
 * Cache dedupes the underlying network requests across passes.
 *
 * On failure the build does not crash — it logs and returns `[]`, matching the
 * reference behaviour. A failed fetch yields an empty listing, never a broken
 * build.
 */
export const fetchGithubRfps = cache(async (): Promise<GithubRfp[]> => {
  let entries: unknown
  try {
    const res = await fetch(RFP_CONTENTS_URL, { headers: githubHeaders() })
    if (!res.ok) {
      console.error(
        `Failed to list RFPs from GitHub: ${res.status} ${res.statusText}`
      )
      return []
    }
    entries = await res.json()
  } catch (error) {
    console.error('Failed to fetch RFP listing from GitHub:', error)
    return []
  }

  if (!Array.isArray(entries)) {
    console.error('GitHub RFP listing returned a non-array response')
    return []
  }

  const mdFiles = entries
    .filter(isContentEntry)
    .filter(
      (entry) =>
        entry.name.endsWith('.md') &&
        entry.name.startsWith('RFP-') &&
        !entry.name.startsWith('RFP-000') &&
        entry.download_url
    )

  const parsed = await Promise.all(
    mdFiles.map(async (entry): Promise<GithubRfp | null> => {
      try {
        const res = await fetch(entry.download_url as string, {
          headers: githubHeaders(),
        })
        if (!res.ok) {
          console.error(`Failed to fetch ${entry.name}: ${res.status}`)
          return null
        }
        const raw = await res.text()
        return parseRfpMarkdown(raw, entry.name, entry.html_url ?? RFP_REPO_URL)
      } catch (error) {
        console.error(`Failed to fetch ${entry.name}:`, error)
        return null
      }
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
