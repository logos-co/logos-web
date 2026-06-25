import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  homeAboutSectionSchema,
  homeBuilderPortalSectionSchema,
  homeChoosePathSectionSchema,
  homeDecideSectionSchema,
  homeSocialProofSectionSchema,
  homeStartBuildingSectionSchema,
  homeUseCasesSectionSchema,
  pageSectionSchema,
} from '../pages'

describe('home section schemas', () => {
  it('parses a homeDecide section', () => {
    const value = {
      componentType: 'homeDecide',
      key: 'home.decide',
      headline: 'We get to decide what comes next.',
      headline2: 'Remain in the decline.',
      headline3: 'Or exit and build the alternative.',
      bodyParts: ['a', 'b', 'c', 'd'],
    }
    assert.deepStrictEqual(homeDecideSectionSchema.parse(value), value)
    assert.deepStrictEqual(pageSectionSchema.parse(value), value)
  })

  it('parses a homeChoosePath section with three paths', () => {
    const path = { title: 't', body: 'b', cta: 'c' }
    const value = {
      componentType: 'homeChoosePath',
      key: 'home.paths',
      title: 'Choose your path',
      kicker: 'k',
      body: 'b',
      build: path,
      operate: path,
      activism: path,
    }
    assert.deepStrictEqual(homeChoosePathSectionSchema.parse(value), value)
  })

  it('rejects an unknown componentType in the union', () => {
    assert.throws(() =>
      pageSectionSchema.parse({ componentType: 'nope', key: 'x' })
    )
  })

  it('rejects a homeDecide section with fewer than 4 bodyParts', () => {
    assert.throws(() =>
      homeDecideSectionSchema.parse({
        componentType: 'homeDecide',
        key: 'home.decide',
        headline: 'We get to decide what comes next.',
        headline2: 'Remain in the decline.',
        headline3: 'Or exit and build the alternative.',
        bodyParts: ['a', 'b', 'c'],
      })
    )
  })

  it('rejects a homeSocialProof section with an empty required string field', () => {
    const stat = { label: 'l', body: 'b' }
    assert.throws(() =>
      homeSocialProofSectionSchema.parse({
        componentType: 'homeSocialProof',
        key: 'home.socialProof',
        headline1: '',
        headline2: 'b',
        manifestoCta: 'c',
        contributions: stat,
        nodeOperators: stat,
        circles: stat,
        winnableIssues: stat,
      })
    )
  })

  it('parses each remaining home section schema with a minimal valid value', () => {
    const stat = { label: 'l', body: 'b' }
    assert.strictEqual(
      homeSocialProofSectionSchema.parse({
        componentType: 'homeSocialProof',
        key: 'home.socialProof',
        headline1: 'a',
        headline2: 'b',
        manifestoCta: 'c',
        contributions: stat,
        nodeOperators: stat,
        circles: stat,
        winnableIssues: stat,
      }).componentType,
      'homeSocialProof'
    )

    assert.strictEqual(
      homeStartBuildingSectionSchema.parse({
        componentType: 'homeStartBuilding',
        key: 'home.startBuilding',
        title: 't',
        body: 'b',
        cta: 'c',
        cardCta: 'cc',
        lambdaPrize: 'l',
        rfps: 'r',
        ideas: 'i',
        docs: 'd',
      }).componentType,
      'homeStartBuilding'
    )

    const problem = { title: 't', subtitle: 's', body: 'b', facts: ['f'] }
    assert.strictEqual(
      homeAboutSectionSchema.parse({
        componentType: 'homeAbout',
        key: 'home.about',
        heading: 'h',
        headingMobile: 'hm',
        problems: {
          debt: problem,
          surveillance: problem,
          corruption: problem,
          stagnation: problem,
        },
      }).componentType,
      'homeAbout'
    )

    const card = { title: 't', body: 'b' }
    assert.strictEqual(
      homeUseCasesSectionSchema.parse({
        componentType: 'homeUseCases',
        key: 'home.useCases',
        eyebrow: 'e',
        headline: 'h',
        headlineMobile: 'hm',
        lambda: 'l',
        lambdaMobile: 'lm',
        secure: card,
        money: card,
        archives: card,
        donations: card,
      }).componentType,
      'homeUseCases'
    )

    assert.strictEqual(
      homeBuilderPortalSectionSchema.parse({
        componentType: 'homeBuilderPortal',
        key: 'home.builderPortal',
        title: 't',
        description: 'd',
        cta: 'c',
        featureChat: 'fc',
        featureNode: 'fn',
        featureTransactions: 'ft',
      }).componentType,
      'homeBuilderPortal'
    )
  })
})
