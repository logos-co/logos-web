import { describe, expect, it } from 'vitest'
import { programmeItems, programmeStatus } from '../_sections/rfp-items'
import type { GithubRfp } from '@/lib/rfps-github'

describe('RFP programme status', () => {
  it('uses the published status, including reopening and closed specifications', () => {
    expect(programmeStatus('open')).toBe('open')
    expect(programmeStatus('Reopening soon')).toBe('upcoming')
    expect(programmeStatus('upcoming')).toBe('upcoming')
    expect(programmeStatus('closed')).toBe('closed')
    expect(programmeStatus('awarded')).toBe('closed')
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
