import { describe, expect, test } from 'vitest'

import { extractSummaryForTest as extractSummary } from '@/lib/rfps-github'

/** Matches the cap in rfps-github.ts, plus the ellipsis a truncation adds. */
const MAX_LENGTH = 156

const withOverview = (body: string) =>
  `# RFP-008 Something\n\n## Overview\n\n${body}\n\n## Deliverables\n\nmore text`

describe('RFP summary extraction', () => {
  test('unwraps markdown links to their label', () => {
    // Arrange — the shape that shipped raw markdown into the meta description
    // of /builders-hub/rfps/curated-lending-vaults.
    const raw = withOverview(
      'Build a curated vault layer on top of the lending protocol delivered by [RFP-008](./RFP-008-lending-borrowing-protocol.md).'
    )

    // Act
    const summary = extractSummary(raw)

    // Assert
    expect(summary).toContain('delivered by RFP-008')
    expect(summary).not.toContain('](')
    expect(summary).not.toContain('.md')
  })

  test('strips emphasis, inline code and images', () => {
    const raw = withOverview(
      'Build a **reusable** library with `standardised` access control for _LEE_ programs. ![diagram](./arch.png)'
    )

    const summary = extractSummary(raw)

    expect(summary).toBe(
      'Build a reusable library with standardised access control for LEE programs.'
    )
  })

  test('never truncates mid-word', () => {
    const raw = withOverview(
      'Build a permissionless liquidation and auction system for collateralized debt position protocols on the Logos Execution Zone, following the established design so that every market is independently parameterised.'
    )

    const summary = extractSummary(raw)

    expect(summary.length).toBeLessThanOrEqual(MAX_LENGTH)
    expect(summary.endsWith('…')).toBe(true)
    // The character before the ellipsis closes a whole word.
    expect(summary.slice(0, -1)).toMatch(/\w$/)
  })

  test('leaves a short summary untouched, with no ellipsis', () => {
    const raw = withOverview('Build a token vesting program on LEZ.')

    expect(extractSummary(raw)).toBe('Build a token vesting program on LEZ.')
  })

  test('collapses multi-line overviews into one line', () => {
    const raw = withOverview('First line of the overview.\nSecond line.')

    expect(extractSummary(raw)).toBe(
      'First line of the overview. Second line.'
    )
  })

  test('falls back to body prose when there is no Overview heading', () => {
    const raw = [
      '# RFP-012 Something',
      '**Status**: open',
      '| a | b |',
      '---',
      'Build a TWAP oracle program that records price observations.',
    ].join('\n')

    const summary = extractSummary(raw)

    expect(summary).toContain('Build a TWAP oracle program')
    expect(summary).not.toContain('**Status**')
    expect(summary).not.toContain('|')
  })
})
