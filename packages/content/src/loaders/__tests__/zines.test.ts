import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getZineCatalogue, getZineIssue, getZinePrintGuide } from '../zines'
import { ContentNotFoundError } from '../_fs'
import { zineCatalogueSchema, zineIssueSchema } from '../../schemas/zines'

describe('zine catalogue and issue', () => {
  it('loads every readable edition with valid contents and a local PDF', async () => {
    const catalogue = await getZineCatalogue('en')
    assert.equal(catalogue.editions.length, 6)
    assert.equal(catalogue.editions.filter((item) => item.reader).length, 6)
    const pageCounts: Record<string, number> = {
      'lan-02': 24,
      'lan-01': 32,
      pioneering: 24,
      'nation-states': 24,
      'open-source': 32,
      reformatting: 26,
    }
    for (const edition of catalogue.editions.filter((item) => item.reader)) {
      const issue = await getZineIssue('en', edition.slug)
      assert.equal(issue.slug, edition.slug)
      assert.equal(issue.pageCount, pageCounts[issue.slug])
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
  it('rejects unknown and traversal slugs before reading a file', async () => {
    for (const slug of ['unknown', '../../site/en/navigation']) {
      await assert.rejects(getZineIssue('en', slug), ContentNotFoundError)
    }
  })
  it('loads print instructions and the separate imposed download', async () => {
    const guide = await getZinePrintGuide('en')
    assert.equal(guide.steps.length, 4)
    assert.ok(guide.spreadPrint)
    const issue = await getZineIssue('en', 'nation-states')
    assert.equal(issue.printLayout, 'spreads')
    assert.equal(issue.imposedPdf, '/zine/nation-states-imposed-a3.pdf')
  })
})
