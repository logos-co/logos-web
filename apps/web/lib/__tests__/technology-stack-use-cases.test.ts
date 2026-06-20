import { getPageCopy } from '@repo/content/loaders'
import type { CardGridSection } from '@repo/content/schemas'
import { describe, expect, it } from 'vitest'

import {
  getTechOverviewUseCasesInitialScrollLeft,
  getTechOverviewUseCaseCards,
  isTechOverviewUseCasesScrollable,
} from '@/lib/technology-stack-use-cases'
import { createSectionFinder } from '@/lib/page-sections'

const findTechnologyStackSection = createSectionFinder('technology-stack')

const cards: CardGridSection['cards'] = [
  {
    title: 'Corruption-resistant public registries',
    description: 'Tamper-proof records.',
    image: {
      src: '/images/technology-stack/usecase-1.jpg',
      alt: '',
      width: 96,
      height: 120,
    },
    cta: {
      label: 'Learn more',
      href: '/technology-stack/blockchain',
    },
  },
  {
    title: 'Decentralised archives',
    description: 'Durable preservation.',
    image: {
      src: '/images/technology-stack/usecase-2.jpg',
      alt: '',
      width: 96,
      height: 77,
    },
    cta: {
      label: 'Learn more',
      href: '/technology-stack/storage',
    },
  },
  {
    title: 'Private financial networks',
    description: 'Money that moves securely and freely, without borders.',
    image: {
      src: '/images/technology-stack/usecase-3.jpg',
      alt: '',
      width: 96,
      height: 119,
    },
    cta: {
      label: 'Learn more',
      href: '/technology-stack/blockchain',
    },
  },
  {
    title: 'Community governance processes',
    description: 'Self-organising groups.',
    image: {
      src: '/images/technology-stack/usecase-4.jpg',
      alt: '',
      width: 96,
      height: 127,
    },
    cta: {
      label: 'Learn more',
      href: '/movement',
    },
  },
]

describe('getTechOverviewUseCaseCards', () => {
  it('does not add duplicate cards beyond the authored list', () => {
    const preparedCards = getTechOverviewUseCaseCards(cards)

    expect(preparedCards.map((card) => card.title)).toEqual([
      'Corruption-resistant public registries',
      'Decentralised archives',
      'Private financial networks',
      'Community governance processes',
    ])
  })

  it('only treats the card row as scrollable when content exceeds the viewport', () => {
    expect(
      isTechOverviewUseCasesScrollable({ scrollWidth: 1416, clientWidth: 2024 })
    ).toBe(false)
    expect(
      isTechOverviewUseCasesScrollable({ scrollWidth: 1416, clientWidth: 1256 })
    ).toBe(true)
  })

  it('starts overflowing rows at the first card', () => {
    expect(getTechOverviewUseCasesInitialScrollLeft()).toBe(0)
  })

  it('uses the requested five-card technology-stack content sequence', async () => {
    const page = await getPageCopy('/technology-stack', 'en')
    const useCases = findTechnologyStackSection<CardGridSection>(
      page.sections,
      'cardGrid',
      'techStack.useCases'
    )

    expect(
      useCases.cards.map(({ title, description }) => ({ title, description }))
    ).toEqual([
      {
        title: 'Attack Resistant Public Registries',
        description:
          'Privacy-preserving blockchain for sovereign order and decentralised governance.',
      },
      {
        title: 'Decentralised Archives',
        description:
          'Permanent, censorship-proof preservation of knowledge, culture, and history.',
      },
      {
        title: 'Private Financial Networks',
        description:
          'Money that moves securely and freely, without surveillance or control.',
      },
      {
        title: 'Community Governance Processes',
        description:
          'Self-organising groups can establish and enforce their own rules, with members engaging voluntarily.',
      },
      {
        title: 'Attack Resistant Public Registries',
        description:
          'Privacy-preserving blockchain for sovereign order and decentralised governance.',
      },
    ])
  })
})
