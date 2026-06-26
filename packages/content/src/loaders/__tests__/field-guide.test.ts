import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { before, describe, it } from 'node:test'

import {
  ContentNotFoundError,
  flattenFieldGuideItems,
  getFieldGuideChapter,
  getFieldGuideManifest,
  getFieldGuideSlugs,
} from '../index'
import { setContentRoot } from '../_fs'

const activeLocale = 'en'
const contentRoot = resolve(process.cwd(), '../../content')

before(() => {
  setContentRoot(contentRoot)
})

describe('field guide loaders', () => {
  it('loads the manifest with ordered, well-formed chapters', async () => {
    const manifest = await getFieldGuideManifest(activeLocale)

    assert.ok(manifest.title)
    assert.ok(manifest.version)
    assert.ok(manifest.sections.length > 0)

    const items = flattenFieldGuideItems(manifest)
    assert.ok(items.length > 0)

    const slugs = new Set<string>()
    for (const item of items) {
      assert.match(item.num, /^\d{2}$/, `bad num for ${item.slug}`)
      assert.ok(item.title, `missing title for ${item.slug}`)
      assert.equal(slugs.has(item.slug), false, `duplicate slug ${item.slug}`)
      slugs.add(item.slug)
    }
  })

  it('loads a Markdown body for every manifest chapter', async () => {
    const slugs = await getFieldGuideSlugs(activeLocale)
    for (const slug of slugs) {
      const body = await getFieldGuideChapter(activeLocale, slug)
      assert.ok(body.trim().length > 0, `empty chapter body for ${slug}`)
      assert.ok(
        body.startsWith('#'),
        `chapter ${slug} should start with a heading`
      )
    }
  })

  it('has no orphan chapter files outside the manifest', async () => {
    const slugs = new Set(await getFieldGuideSlugs(activeLocale))
    const chaptersDir = resolve(
      contentRoot,
      'field-guide',
      activeLocale,
      'chapters'
    )
    const fileSlugs = readdirSync(chaptersDir)
      .filter((name) => name.endsWith('.md'))
      .map((name) => name.replace(/\.md$/, ''))

    assert.equal(
      fileSlugs.length,
      slugs.size,
      'chapter file count must match manifest item count'
    )
    for (const fileSlug of fileSlugs) {
      assert.equal(
        slugs.has(fileSlug),
        true,
        `orphan chapter file "${fileSlug}.md" has no manifest entry`
      )
    }
  })

  it('raises ContentNotFoundError for an unknown chapter slug', async () => {
    await assert.rejects(
      getFieldGuideChapter(activeLocale, 'does-not-exist'),
      (error: unknown) => error instanceof ContentNotFoundError
    )
  })

  it('rejects inactive locales instead of silently falling back', async () => {
    await assert.rejects(
      getFieldGuideManifest('fr'),
      /locale "fr" is not active/
    )
  })
})
