import { describe, expect, it } from 'vitest'

import { rewriteRfpMarkdownLinks } from '@/lib/rfps-github'

const FILE_URL =
  'https://github.com/logos-co/rfp/blob/master/RFPs/RFP-016-lbp-launchpad.md'

describe('rewriteRfpMarkdownLinks', () => {
  it('rewrites sibling RFP cross-references to internal detail routes', () => {
    const md = 'See [LBP](./RFP-008-lending-borrowing-protocol.md) for context.'

    expect(rewriteRfpMarkdownLinks(md, FILE_URL)).toBe(
      'See [LBP](/builders-hub/rfps/lending-borrowing-protocol) for context.'
    )
  })

  it('rewrites RFP references without a leading ./', () => {
    const md = '[admin](RFP-001-admin-authority-lib.md)'

    expect(rewriteRfpMarkdownLinks(md, FILE_URL)).toBe(
      '[admin](/builders-hub/rfps/admin-authority-lib)'
    )
  })

  it('resolves other repo-relative .md links to absolute GitHub URLs, keeping anchors', () => {
    const md =
      '[fees](../appendix/token-launchpad-ecosystem.md#fee-structures)'

    expect(rewriteRfpMarkdownLinks(md, FILE_URL)).toBe(
      '[fees](https://github.com/logos-co/rfp/blob/master/appendix/token-launchpad-ecosystem.md#fee-structures)'
    )
  })

  it('leaves external, absolute, and anchor links unchanged', () => {
    const md = [
      '[ext](https://github.com/logos-co/lambda-prize/blob/master/prizes/LP-0004.md)',
      '[abs](/builders-hub/rfps)',
      '[frag](#overview)',
    ].join('\n')

    expect(rewriteRfpMarkdownLinks(md, FILE_URL)).toBe(md)
  })

  it('leaves relative non-markdown links untouched', () => {
    const md = '![diagram](./images/flow.png)'

    expect(rewriteRfpMarkdownLinks(md, FILE_URL)).toBe(md)
  })
})
