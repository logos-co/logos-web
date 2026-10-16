import { describe, expect, it } from 'vitest'
import { getZineIssue, getZineArticleBodies } from '@repo/content/loaders'
import { articleTitle } from '../reader-state'

describe('zine source articles', () => {
  it('preserves the original articles and reference destinations', async () => {
    const issue = await getZineIssue('en', 'lan-01')
    const bodies = await getZineArticleBodies('en', 'lan-01')
    expect(issue.articles).toHaveLength(18)
    expect(Object.keys(bodies).sort()).toEqual(
      issue.articles!.map((article) => article.slug).sort()
    )
    expect(
      new Set(issue.articles!.flatMap((article) => article.references)).size
    ).toBe(10)
    const manifesto = bodies['anti-palantir-manifesto']
    expect(manifesto.match(/^1\. /gm)).toHaveLength(22)
    expect(manifesto).toContain('Note from Harry Halpin')
    expect(bodies.samizdat).toContain('Stephen Duncombe')
    expect(bodies['transaction-supply-chain'].match(/^\| ---/gm)).toHaveLength(
      2
    )
  })

  it('attributes words on a shared page to the correct article', async () => {
    const issue = await getZineIssue('en', 'lan-01')
    const second = issue.sections
      .flatMap((section) => section.entries)
      .find((entry) => entry.title === 'For One of Our Own')!
    expect(articleTitle(issue, 15, 0)).toBe('What Is the Parallel Economy?')
    expect(articleTitle(issue, 15, second.startWord! - 1)).toBe(
      'What Is the Parallel Economy?'
    )
    expect(articleTitle(issue, 15, second.startWord!)).toBe(
      'For One of Our Own'
    )
    expect(articleTitle(issue, 10)).toBe('The Transaction Supply Chain')
  })
})
