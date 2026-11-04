import { createHash, randomUUID } from 'node:crypto'

const padTwo = (value: number): string => value.toString().padStart(2, '0')

const formatTimestamp = (date: Date): string => {
  const yyyy = date.getUTCFullYear().toString()
  const mm = padTwo(date.getUTCMonth() + 1)
  const dd = padTwo(date.getUTCDate())
  const hh = padTwo(date.getUTCHours())
  const mi = padTwo(date.getUTCMinutes())
  return `${yyyy}${mm}${dd}-${hh}${mi}`
}

/**
 * Slugify a free-form record identifier (slug, route, or label) into a
 * branch-safe segment: lowercase, kebab-case, alphanumeric + dashes only,
 * collapsed.
 */
const slugifyForBranch = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

export interface BranchNameInput {
  contentType: string
  targetPath: string
  prefix?: string
  now?: Date
}

export function contentBranchStem({
  contentType,
  targetPath,
  prefix = 'content/',
}: BranchNameInput) {
  const key = createHash('sha256').update(targetPath).digest('hex').slice(0, 24)
  return `${prefix}${slugifyForBranch(contentType)}-${key}/`
}

export const buildContentBranchName = (input: BranchNameInput): string =>
  `${contentBranchStem(input)}${formatTimestamp(input.now ?? new Date())}-${randomUUID()}`
