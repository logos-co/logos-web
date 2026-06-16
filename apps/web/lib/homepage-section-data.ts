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

type Translate = (key: string) => string

export const HOME_USE_CASE_CARDS: HomeUseCaseCard[] = [
  { key: 'secure', image: '/images/home/use-cases/secure.png' },
  { key: 'money', image: '/images/home/use-cases/money.png' },
  { key: 'archives', image: '/images/home/use-cases/archives.png' },
  { key: 'donations', image: '/images/home/use-cases/donations.png' },
]

export function getSocialProofCards(
  stats: SocialProofStats,
  t: Translate
): HomeStatCard[] {
  return [
    {
      key: 'contributions',
      value: stats.contributors,
      label: t('contributions.label'),
      body: t('contributions.body'),
    },
    {
      key: 'nodeOperators',
      value: '226',
      label: t('nodeOperators.label'),
      body: t('nodeOperators.body'),
    },
    {
      key: 'circles',
      value: '47',
      label: t('circles.label'),
      body: t('circles.body'),
    },
    {
      key: 'winnableIssues',
      value: '13',
      label: t('winnableIssues.label'),
      body: t('winnableIssues.body'),
    },
  ]
}
