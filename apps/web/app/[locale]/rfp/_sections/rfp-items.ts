import type { GithubRfp } from '@/lib/rfps-github'

export type RfpStatus = 'open' | 'upcoming' | 'closed'
export interface ProgrammeRfp {
  number: string
  slug: string
  title: string
  summary: string
  category: string
  tier: string
  status: RfpStatus
}

export function programmeStatus(status: string): RfpStatus {
  const value = status.toLowerCase()
  if (/reopen|upcoming|coming soon/.test(value)) return 'upcoming'
  return value === 'open' ? 'open' : 'closed'
}

export function programmeItems(items: GithubRfp[]): ProgrammeRfp[] {
  return items.map(
    ({ number, slug, title, summary, category, tier, status }) => ({
      number,
      slug,
      title,
      summary,
      category,
      tier,
      status: programmeStatus(status),
    })
  )
}
