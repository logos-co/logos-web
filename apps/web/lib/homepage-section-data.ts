import type { SocialProofStats } from './social-proof-stats'

export interface HomeUseCaseCard {
  key: 'secure' | 'money' | 'archives' | 'donations'
  image: string
}

export interface HomeStatCard {
  key: 'contributions' | 'nodeOperators' | 'circles' | 'winnableIssues'
  value: string
  label: string
  body: string
}

interface SocialProofCopy {
  contributions: { label: string; body: string }
  nodeOperators: { label: string; body: string }
  circles: { label: string; body: string }
  winnableIssues: { label: string; body: string }
}

export const HOME_USE_CASE_CARDS: HomeUseCaseCard[] = [
  { key: 'secure', image: '/images/home/use-cases/secure.png' },
  { key: 'money', image: '/images/home/use-cases/money.png' },
  { key: 'archives', image: '/images/home/use-cases/archives.png' },
  { key: 'donations', image: '/images/home/use-cases/donations.png' },
]

export function getSocialProofCards(
  stats: SocialProofStats,
  winnableIssuesCount: string,
  copy: SocialProofCopy
): HomeStatCard[] {
  return [
    {
      key: 'contributions',
      value: stats.contributors,
      label: copy.contributions.label,
      body: copy.contributions.body,
    },
    {
      key: 'nodeOperators',
      value: '226',
      label: copy.nodeOperators.label,
      body: copy.nodeOperators.body,
    },
    {
      key: 'circles',
      value: '47',
      label: copy.circles.label,
      body: copy.circles.body,
    },
    {
      key: 'winnableIssues',
      value: winnableIssuesCount,
      label: copy.winnableIssues.label,
      body: copy.winnableIssues.body,
    },
  ]
}
