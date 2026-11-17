import { describe, expect, it } from 'vitest'
import {
  programmeItems,
  programmeStatus,
  rfpDetailBody,
} from '@/lib/rfp-programme'
import type { GithubRfp } from '@/lib/rfps-github'

describe('RFP programme status', () => {
  it('uses the published status, including reopening and closed specifications', () => {
    expect(programmeStatus('open')).toBe('open')
    expect(programmeStatus('Reopening soon')).toBe('upcoming')
    expect(programmeStatus('upcoming')).toBe('upcoming')
    expect(programmeStatus('closed')).toBe('closed')
    expect(programmeStatus('awarded')).toBe('closed')
  })

  it('hides application instructions on closed and upcoming detail pages', () => {
    const body =
      '## Overview\nSpec.\n\n## ✏️ How to Apply\nSubmit here.\n\n## Resources\nDocs.'
    expect(rfpDetailBody(body, 'open')).toBe(body)
    expect(rfpDetailBody(body, 'closed')).toBe(
      '## Overview\nSpec.\n\n## Resources\nDocs.'
    )
    expect(
      rfpDetailBody('Spec.\n\n## How to Apply\nSubmit here.', 'upcoming')
    ).toBe('Spec.')
  })

  it('keeps source data intact and excludes full Markdown from client props', () => {
    const source: GithubRfp = {
      number: 'RFP-005',
      slug: '005-multisig-and-coordination',
      title: 'Multisig and Coordination',
      summary: 'Build a multisig.',
      category: 'Applications & Integrations',
      tier: 'L',
      status: 'closed',
      githubUrl: 'https://github.com/logos-co/rfp/blob/master/RFPs/RFP-005.md',
      rawMarkdown: '# Full specification',
    }
    const items = programmeItems([source])
    expect(items[0]?.status).toBe('closed')
    expect(items[0]?.slug).toBe(source.slug)
    expect(items[0]).not.toHaveProperty('rawMarkdown')
    expect(source.status).toBe('closed')
    expect(source.rawMarkdown).toBe('# Full specification')
  })
})
