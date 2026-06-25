import { test } from 'node:test'
import assert from 'node:assert/strict'

import { getStartedCopySectionSchema, movementCopySectionSchema, pageSectionSchema } from '../pages'

test('getStartedCopy parses a minimal valid value and routes through the union', () => {
  const value = {
    componentType: 'getStartedCopy',
    key: 'getStarted.copy',
    heading: 'Get Started',
    intro: 'x',
    sections: {
      install: { number: '01', heading: 'h', cardTitle: 'c', body: 'b', cta: 'i', imageAlt: 'a' },
      docs: { number: '02', heading: 'h', items: { docs: { title: 't', body: 'b' } }, viewDocsCta: 'v', learnMoreCta: 'l', atomicSwapsCta: 'a', multisigCta: 'm' },
      community: { number: '04', heading: 'h', cta: 'c', items: { forum: 'f' } },
      build: { number: '04', heading: 'h', cta: 'c', nodeCta: 'n', messagingCta: 'm', deployCta: 'd', tryItOutCta: 't', scaffoldCta: 's', items: { node: { title: 't', body: 'b' } } },
    },
  }
  assert.equal(getStartedCopySectionSchema.parse(value).componentType, 'getStartedCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'getStartedCopy')
})

test('movementCopy parses a minimal valid value and routes through the union', () => {
  const value = {
    componentType: 'movementCopy',
    key: 'movement.copy',
    heading: 'Movement',
    hero: { title: 't', kicker: 'k', body: 'b', primaryCta: 'p', secondaryCta: 's' },
    intro: { titleLine1: 'a', titleLine2: 'b', body: 'c' },
    actions: { activism: { title: 't', body: 'b', cta: 'c' }, coalition: { title: 't', body: 'b', cta: 'c' }, building: { title: 't', body: 'b', cta: 'c' } },
    campaign: { eyebrow: 'e', kicker: 'k', title: 't', body: 'b', primaryCta: 'p', secondaryCta: 's', tertiaryCta: 't' },
    find: { title: 't', body: 'b', cta: 'c' },
    activismSection: { title: 't', body: 'b', cta: 'c' },
    events: { title: 't', body: 'b', cta: 'c', day1: { date: 'd', weekday: 'w' }, day2: { date: 'd', weekday: 'w' }, day3: { date: 'd', weekday: 'w' }, card: { title: 't', time: 't', timezone: 'z', location: 'l', hosts: 'h' } },
    involved: { title: 't', body: 'b', primaryCta: 'p', secondaryCta: 's' },
    coalition: { title: 't', body: 'b', cta: 'c' },
    builder: { title: 't', body: 'b', primaryCta: 'p', secondaryCta: 's', feature: { city: 'c', title: 't', cta: 'c' }, details: { problem: { label: 'l', body: 'b' }, solution: { label: 'l', body: 'b' }, stack: { label: 'l', body: 'b' } } },
    resources: { titleLine1: 'a', titleLine2: 'b', body: 'c', cta: 'd', rows: { start: { number: '01', title: 't', body: 'b', cta: 'c' } } },
  }
  assert.equal(movementCopySectionSchema.parse(value).componentType, 'movementCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'movementCopy')
})
