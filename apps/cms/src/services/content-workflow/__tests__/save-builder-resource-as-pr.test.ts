import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { type BuilderResourceDocLike } from '../save-builder-resource-as-pr'

import { resourceListEdit } from '../resource-list'

const createResourceDoc = (
  overrides: Partial<BuilderResourceDocLike> = {}
): BuilderResourceDocLike => ({
  slug: 'quick-start',
  status: 'published',
  title: 'Quick Start',
  description: 'Spin up a Logos-powered app in under five minutes.',
  ctaLabel: 'Read',
  href: '/technology-stack',
  ...overrides,
})

describe('resourceListEdit', () => {
  it('writes the Builders Hub resources flat file in repo shape', async () => {
    const change = resourceListEdit(
      'builder-resource',
      createResourceDoc(),
      'upsert'
    ).apply({
      schemaVersion: 1,
      language: 'en',
      items: [
        createResourceDoc({
          slug: 'video-tutorials',
          href: 'https://youtube.com/@Logos_network',
        }),
      ],
    })
    assert.equal(change.path, 'content/builders-hub/resources/en.json')
    assert.ok('content' in change)
    const json = JSON.parse(String(change.content)) as {
      items: Array<{ slug: string; href: string }>
    }
    assert.deepEqual(
      json.items.map((item) => item.slug),
      ['quick-start', 'video-tutorials']
    )
    assert.equal(json.items[0]?.href, '/technology-stack')
  })

  it('replaces the old slug on rename and preserves the other items', () => {
    const original = createResourceDoc()
    const untouched = createResourceDoc({ slug: 'another' })
    const file = {
      schemaVersion: 1,
      language: 'en',
      items: [original, untouched],
    }
    const change = resourceListEdit(
      'builder-resource',
      { ...original, slug: 'renamed' },
      'upsert',
      original.slug
    ).apply(file)
    assert.ok('content' in change)
    assert.deepEqual(
      JSON.parse(String(change.content)).items.map(
        (entry: BuilderResourceDocLike) => entry.slug
      ),
      ['another', 'renamed']
    )
  })
})
