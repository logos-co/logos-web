import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  countWinnableIssueCircles,
  getWinnableIssuesCount,
} from '../winnable-issues'

const htmlResponse = (body: string): Response =>
  ({
    ok: true,
    status: 200,
    text: async () => body,
  }) as unknown as Response

// One "Local context" marker per Circle, mirroring the readme markup.
const circleSection = (name: string): string =>
  `<h2>${name}</h2><p><strong class="font-bold">Local context</strong> ...</p>` +
  `<p><strong class="font-bold">Winnable Issue:</strong> ...</p>` +
  `<p><strong class="font-bold">Status:</strong> ...</p>`

const pageWith = (circles: number): string =>
  Array.from({ length: circles }, (_, i) =>
    circleSection(`City ${i + 1}`)
  ).join('')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('countWinnableIssueCircles', () => {
  test('counts one Circle per "Local context" marker, not per issue', () => {
    // A Circle with two issues + two statuses still counts as a single Circle.
    const twoIssueCircle =
      '<strong>Local context</strong>' +
      '<strong>Winnable Issue #1:</strong><strong>Status:</strong>' +
      '<strong>Winnable Issue #2:</strong><strong>Status:</strong>'

    expect(countWinnableIssueCircles(twoIssueCircle)).toBe(1)
  })

  test('matches the "Local Context" capitalisation variant', () => {
    expect(countWinnableIssueCircles('<strong>Local Context</strong>')).toBe(1)
  })
})

describe('getWinnableIssuesCount', () => {
  test('floors at 19 while the page lists fewer Circles (Porto/Barcelona pending)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      htmlResponse(pageWith(17))
    )

    await expect(getWinnableIssuesCount()).resolves.toBe('19')
  })

  test('follows the live count once the page lists 19 or more Circles', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      htmlResponse(pageWith(21))
    )

    await expect(getWinnableIssuesCount()).resolves.toBe('21')
  })

  test('uses the 19 floor when the page fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    await expect(getWinnableIssuesCount()).resolves.toBe('19')
  })
})
