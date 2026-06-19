import { WINNABLE_ISSUES_PAGE_URL } from './logos-data-api'
import { logger } from './logger'

/**
 * The homepage "Winnable Issues" stat reports the number of Circles actively
 * working on a winnable issue — NOT the number of individual issues. A single
 * Circle may run several issues, and some issues are already completed, so the
 * per-issue total overcounts; the per-Circle total is the intended metric.
 *
 * Stakeholder-confirmed floor: there are 19 Circles working on winnable issues.
 * Two of them (Barcelona and Porto) are not yet listed on the source page, so
 * the live page currently enumerates only 17. We therefore display at least 19
 * and let the live count win once the page catches up (19+).
 */
const MIN_WINNABLE_ISSUE_CIRCLES = 19

/**
 * Counting criterion: every Circle's section on the readme opens with a bold
 * "Local context" intro — exactly one per Circle. Counting those markers counts
 * the Circles regardless of how many issues each one lists. Matches
 * `<strong ...>Local context` / `Local Context`, case-insensitively.
 */
const CIRCLE_MARKER_PATTERN = /<strong[^>]*>\s*Local\s+context/gi

/** Guardrail: an absurd parse result means the markup changed; ignore it. */
const MAX_PLAUSIBLE_CIRCLES = 100

export function countWinnableIssueCircles(html: string): number {
  const matches = html.match(CIRCLE_MARKER_PATTERN)
  return matches ? matches.length : 0
}

async function fetchWinnableIssuesHtml(): Promise<string | null> {
  try {
    const response = await fetch(WINNABLE_ISSUES_PAGE_URL, {
      cache: 'force-cache',
    })

    if (!response.ok) {
      throw new Error(`Winnable issues request failed: ${response.status}`)
    }

    return await response.text()
  } catch (error) {
    logger.error('Failed to fetch winnable issues page', { error })
    return null
  }
}

export async function getWinnableIssuesCount(): Promise<string> {
  const html = await fetchWinnableIssuesHtml()
  if (html === null) {
    return String(MIN_WINNABLE_ISSUE_CIRCLES)
  }

  const circles = countWinnableIssueCircles(html)

  // Implausibly high count means the markup drifted into matching unrelated
  // text, so fall back to the confirmed floor rather than ship a broken stat.
  if (circles > MAX_PLAUSIBLE_CIRCLES) {
    logger.warn('Winnable issue circle count implausibly high; using floor', {
      circles,
    })
    return String(MIN_WINNABLE_ISSUE_CIRCLES)
  }

  // Floor at the stakeholder-confirmed 19 until the page lists every Circle;
  // once it does (19+), the live count takes over.
  return String(Math.max(circles, MIN_WINNABLE_ISSUE_CIRCLES))
}
