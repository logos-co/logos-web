import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import homePage from '../../../../../../content/pages/en/home.json' with { type: 'json' }

import { buildPageFixtureChange, type PageDocLike } from '../save-page-as-pr'

const createPageDoc = (overrides: Partial<PageDocLike> = {}): PageDocLike => ({
  slug: 'about',
  route: '/about',
  page: {
    schemaVersion: 1,
    language: 'en',
    route: '/about',
    title: 'About | Logos',
    description: 'About Logos.',
    heading: 'About Logos',
    sections: [
      {
        componentType: 'hero',
        key: 'about.hero',
        headline: 'About Logos',
      },
    ],
  },
  ...overrides,
})

describe('buildPageFixtureChange', () => {
  it('writes a route-derived page fixture after schema validation', () => {
    const change = buildPageFixtureChange(createPageDoc())

    assert.equal(change.path, 'content/pages/en/about.json')
    assert.ok('content' in change)

    const page = JSON.parse(String(change.content)) as { route: string }
    assert.equal(page.route, '/about')
  })

  it('rejects a page whose JSON route does not match the edited route', () => {
    assert.throws(
      () =>
        buildPageFixtureChange(
          createPageDoc({
            route: '/about',
            page: {
              ...(createPageDoc().page as Record<string, unknown>),
              route: '/movement',
            },
          })
        ),
      /page route mismatch/
    )
  })

  it('accepts the current Home page sections through the CMS workflow', () => {
    const change = buildPageFixtureChange({
      slug: 'home',
      route: '/',
      page: homePage,
    })

    assert.equal(change.path, 'content/pages/en/home.json')
    assert.ok('content' in change)

    const page = JSON.parse(String(change.content)) as {
      sections: Array<{ componentType: string }>
    }
    const sectionTypes = page.sections.map(({ componentType }) => componentType)

    assert.ok(sectionTypes.includes('homeUseCases'))
    assert.ok(sectionTypes.includes('homePrifi'))
  })
})
