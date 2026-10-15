import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getZineCatalogue, getZineIssue } from '../zines'
import { ContentNotFoundError } from '../_fs'
import { zineCatalogueSchema, zineIssueSchema } from '../../schemas/zines'

describe('zine catalogue and issue', () => {
  it('loads every readable edition with valid contents and a local PDF', async () => {
    const catalogue = await getZineCatalogue('en')
    assert.equal(catalogue.editions.length, 5)
    for (const edition of catalogue.editions.filter((item) => item.reader)) {
      const issue = await getZineIssue('en', edition.slug)
      assert.equal(issue.slug, edition.slug)
      assert.equal(issue.pageCount, 32)
      assert.equal(issue.sections[0].entries[0].page, 4)
      assert.match(issue.pdf, /^\/zine\//)
      assert.equal(
        zineIssueSchema.safeParse({ ...issue, pageCount: 4 }).success,
        false
      )
    }
    assert.equal(
      zineCatalogueSchema.safeParse({
        ...catalogue,
        editions: [catalogue.editions[0], catalogue.editions[0]],
      }).success,
      false
    )
  })
  it('rejects unknown, external-only and traversal slugs before reading a file', async () => {
    for (const slug of [
      'unknown',
      'nation-states',
      '../../site/en/navigation',
    ]) {
      await assert.rejects(getZineIssue('en', slug), ContentNotFoundError)
    }
  })
})
