import { describe, expect, it } from 'vitest'
import { getZineIssue } from '@repo/content/loaders'
import { articleTitle } from '../reader-state'

describe('zine article titles', () => {
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

  it('keeps October articles on shared pages distinct in search and guided reading', async () => {
    const issue = await getZineIssue('en', 'lan-02')
    for (const [page, first, second] of [
      [10, 'From Training to Internship', 'How to Spot the Scam'],
      [18, 'Three Weeks, Sixty Percent', 'More Than Doctors and Lawyers'],
    ] as const) {
      const entry = issue.sections
        .flatMap((section) => section.entries)
        .find((entry) => entry.title === second)!
      expect(entry.startWord).toBeGreaterThan(0)
      expect(articleTitle(issue, page, entry.startWord! - 1)).toBe(first)
      expect(articleTitle(issue, page, entry.startWord!)).toBe(second)
    }
  })
})
