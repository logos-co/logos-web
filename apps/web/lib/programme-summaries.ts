import type {
  DeveloperProgramme,
  DeveloperProgrammesCopySection,
} from '@repo/content/schemas'

import type { loadLambdaProgramme } from '@/lib/lambda-programme'
import type { ProgrammeRfp, RfpStatus } from '@/lib/rfp-programme'

export interface ProgrammeSummary extends Omit<
  DeveloperProgramme,
  'stats' | 'highlight'
> {
  stats: { label: string; value: string }[]
  highlight?: { label: string; title: string; detail?: string }
  opportunities: { code: string; title: string; detail: string }[]
  availability?: string
}

export function programmeSummaries(
  copy: DeveloperProgrammesCopySection['programmes'],
  rfp: { items: ProgrammeRfp[]; statuses: Record<RfpStatus, string> },
  lambda: Pick<
    Awaited<ReturnType<typeof loadLambdaProgramme>>,
    'largest' | 'openCards' | 'openTotal' | 'awardedCount'
  >,
  prizeAvailability: string
): [ProgrammeSummary, ProgrammeSummary] {
  const [rfpCopy, prizeCopy] = copy
  const openRfps = rfp.items.filter(({ status }) => status === 'open')
  const featuredRfp = openRfps[0]
  const otherRfps = [
    ...openRfps.slice(1),
    ...rfp.items.filter(({ status }) => status === 'upcoming'),
  ]
  const largest = lambda.largest

  return [
    {
      ...rfpCopy,
      stats: [
        { ...rfpCopy.stats[0], value: String(rfp.items.length) },
        rfpCopy.stats[1],
        rfpCopy.stats[2],
      ],
      highlight: featuredRfp && {
        label: rfpCopy.highlight.label,
        title: `${featuredRfp.number}  ${featuredRfp.title}`,
      },
      opportunities: otherRfps.slice(0, 2).map(({ number, title, status }) => ({
        code: number,
        title,
        detail: rfp.statuses[status],
      })),
    },
    {
      ...prizeCopy,
      availability: prizeAvailability,
      stats: [
        { ...prizeCopy.stats[0], value: String(lambda.openCards.length) },
        { ...prizeCopy.stats[1], value: lambda.openTotal },
        { ...prizeCopy.stats[2], value: String(lambda.awardedCount) },
      ],
      highlight: largest && {
        label: prizeCopy.highlight.label,
        title: `${largest.id}  ${largest.title}`,
        detail: largest.amount,
      },
      opportunities: lambda.openCards
        .filter(({ id }) => id !== largest?.id)
        .slice(0, 2)
        .map(({ id, title, amount }) => ({ code: id, title, detail: amount })),
    },
  ]
}
