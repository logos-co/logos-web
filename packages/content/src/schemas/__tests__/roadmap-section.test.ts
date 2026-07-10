import { test } from 'node:test'
import assert from 'node:assert/strict'

import { pageSectionSchema, roadmapCopySectionSchema } from '../pages'

test('roadmapCopy parses a minimal valid value and routes through the union', () => {
  const image = {
    src: '/images/roadmap/card.png',
    alt: '',
    width: 1,
    height: 1,
  }
  const value = {
    componentType: 'roadmapCopy',
    key: 'roadmap.copy',
    hero: {
      eyebrow: 'Roadmap eyebrow.',
      heading: 'Logos Roadmap',
      disclaimer: 'Timelines may change.',
      image,
    },
    release: {
      tabsAriaLabel: 'Roadmap releases',
      activeTab: 'Testnet v0.1',
      items: [
        {
          tab: 'Testnet v0.1',
          dateLabel: 'Date Released',
          date: 'March 7, 2026',
          objectiveLabel: 'Key Objectives',
          objective: 'Architectural Validation',
          releaseNotes: {
            label: 'Release Notes',
            href: 'https://roadmap.logos.co/testnets/v01',
          },
          body: ['Release body.'],
          modules: [
            {
              label: 'Logos Core',
              body: 'Module body.',
              actions: [{ label: 'Docs', variant: 'secondary' }],
            },
          ],
        },
      ],
    },
    overview: {
      heading: 'Road Map Overview',
      cards: [
        {
          id: 'logosCoreRuntime',
          title: 'Logos Core',
          body: ['Card body.'],
          image,
          cta: { label: 'Full roadmap', variant: 'light' },
        },
      ],
    },
    faqs: {
      heading: 'Roadmap FAQs',
      items: [{ question: 'Question?', answer: ['Answer.'] }],
    },
  }

  assert.equal(
    roadmapCopySectionSchema.parse(value).componentType,
    'roadmapCopy'
  )
  assert.equal(pageSectionSchema.parse(value).componentType, 'roadmapCopy')

  assert.throws(() =>
    roadmapCopySectionSchema.parse({
      ...value,
      overview: {
        ...value.overview,
        cards: [{ id: 'announcement', image }],
      },
    })
  )

  assert.throws(() =>
    roadmapCopySectionSchema.parse({
      ...value,
      overview: {
        ...value.overview,
        cards: [{ id: 'announcement', body: [], image }],
      },
    })
  )
})
