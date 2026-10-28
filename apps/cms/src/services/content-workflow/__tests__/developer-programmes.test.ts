import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import fixture from '../../../../../../content/pages/en/developer-programmes.json' with { type: 'json' }
import { getPageCopy } from '@repo/content/loaders'

import { buildPageFixtureChange } from '../save-page-as-pr'

describe('developer programmes page publishing', () => {
  it('loads the complete page without dropping any editable fields', async () => {
    assert.deepEqual(await getPageCopy('/developer-programmes', 'en'), fixture)
  })

  it('preserves edited copy, desktop breaks, media and links in the PR fixture', () => {
    const page = structuredClone(fixture)
    const copy = page.sections[0]!
    copy.hero.title = 'Build something new.'
    copy.hero.body = 'An edited first line.\nAn edited second line.'
    copy.programmes[0]!.cta = {
      label: 'See the briefs',
      href: '/builders-hub/rfps',
    }
    copy.programmes[1]!.stats[0]!.value = '8'
    copy.programmes[0]!.comparison[0]!.body = 'An updated proposal process.'
    copy.programmes[1]!.choice.statements[0] = 'An updated builder profile.'
    copy.statement.image = {
      src: '/images/developer-programmes/build.webp',
      alt: 'Edited description',
    }
    copy.resources.items[0]!.cta.label = 'Get Basecamp'

    const change = buildPageFixtureChange({
      slug: 'developer-programmes',
      route: '/developer-programmes',
      page,
    })

    assert.equal(change.path, 'content/pages/en/developer-programmes.json')
    assert.ok('content' in change)
    assert.deepEqual(JSON.parse(String(change.content)), page)
  })

  it('rejects missing programme copy and unsafe button destinations', () => {
    const page = structuredClone(fixture)
    page.sections[0]!.programmes[0]!.cta.href = 'javascript:alert(1)'
    assert.throws(
      () =>
        buildPageFixtureChange({
          slug: 'developer-programmes',
          route: page.route,
          page,
        }),
      /href must start/
    )
    page.sections[0]!.programmes[0]!.cta.href = '/builders-hub/rfps'
    page.sections[0]!.programmes[0]!.body = ''
    assert.throws(() =>
      buildPageFixtureChange({
        slug: 'developer-programmes',
        route: page.route,
        page,
      })
    )
  })
})
