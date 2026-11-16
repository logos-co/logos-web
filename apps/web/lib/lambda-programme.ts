import { cache } from 'react'
import { getTranslations } from 'next-intl/server'
import { getPageCopy } from '@repo/content/loaders'
import type { Language, LambdaPrizeCopySection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import { fetchGithubPrizes, type GithubPrize } from '@/lib/lambda-prizes-github'
import { createSectionFinder } from '@/lib/page-sections'

type PrizePresentation = LambdaPrizeCopySection['prizes'][number]

export interface PrizeCard {
  id: string
  title: string
  status: 'open' | 'coming-soon'
  statusLabel: string
  body: string
  amount: string
  cta?: { label: string; href: string }
  featured?: PrizePresentation['featured']
}

export function resolvePrizeProgramme(
  copy: LambdaPrizeCopySection,
  source: { prizes: GithubPrize[]; awardedIds: ReadonlySet<string> },
  formatAmount: (amount: number) => string,
  labels: { open: string; comingSoon: string; learnMore: string }
) {
  const presentationById = new Map(copy.prizes.map((item) => [item.id, item]))
  const sourceById = new Map(source.prizes.map((item) => [item.id, item]))
  const ordered = [
    ...new Set([
      ...presentationById.keys(),
      ...source.prizes.map(({ id }) => id).sort((a, b) => b.localeCompare(a)),
    ]),
  ]
  const open = ordered.flatMap((id) => {
    const prize = sourceById.get(id)
    return prize?.status === 'open' ? [prize] : []
  })
  const comingSoon = copy.prizes.flatMap(({ id, comingSoon }) => {
    const prize = sourceById.get(id)
    return comingSoon && prize?.status === 'draft' ? [prize] : []
  })
  const toCard = (
    prize: GithubPrize,
    status: PrizeCard['status']
  ): PrizeCard => {
    const presentation = presentationById.get(prize.id)
    const label = status === 'open' ? labels.open : labels.comingSoon
    return {
      id: prize.id,
      title: prize.title,
      body: presentation?.body ?? prize.summary,
      status,
      statusLabel: [label, prize.size]
        .filter(Boolean)
        .join(' · ')
        .toUpperCase(),
      amount: prize.amount === null ? '' : formatAmount(prize.amount),
      ...(status === 'open' && {
        cta: { label: labels.learnMore, href: prize.href },
        featured: presentation?.featured,
      }),
    }
  }
  const openCards = open.map((prize) => toCard(prize, 'open'))
  const largest = open.reduce<GithubPrize | undefined>(
    (current, prize) =>
      !current || (prize.amount ?? 0) > (current.amount ?? 0) ? prize : current,
    undefined
  )
  const awardedCount = source.prizes.filter(
    ({ id, status }) => status === 'closed' && source.awardedIds.has(id)
  ).length

  return {
    cards: [
      ...openCards,
      ...comingSoon.map((prize) => toCard(prize, 'coming-soon')),
    ],
    openCards,
    recommended: openCards.find((card) => card.featured) ?? openCards.at(0),
    largest: largest ? toCard(largest, 'open') : undefined,
    openTotal: formatAmount(
      open.reduce((sum, prize) => sum + (prize.amount ?? 0), 0)
    ),
    awardedCount,
  }
}

const findSection = createSectionFinder('lambda-prize')

export const loadLambdaProgramme = cache(async (locale: Language) => {
  const [page, source, t] = await Promise.all([
    getPageCopy(ROUTES.lambdaPrize, locale),
    fetchGithubPrizes(),
    getTranslations({ locale, namespace: 'programmeData' }),
  ])
  const copy = findSection<LambdaPrizeCopySection>(
    page.sections,
    'lambdaPrizeCopy',
    'lambdaPrize.copy'
  )
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  const prizes = resolvePrizeProgramme(copy, source, formatter.format, {
    open: t('open'),
    comingSoon: t('comingSoon'),
    learnMore: t('learnMore'),
  })

  return {
    copy,
    ...prizes,
    openDescription: t('openDescription', {
      open: prizes.openCards.length,
      upcoming: prizes.cards.length - prizes.openCards.length,
    }),
    awardedDescription: t('awardedDescription', { count: prizes.awardedCount }),
  }
})
