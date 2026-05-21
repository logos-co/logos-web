/**
 * Computes the scorecard average from the six scoring fields.
 * Returns null if all values are null.
 * Rounds to two decimal places.
 */
export function computeScorecard(
  scores: Record<string, number | null>
): number | null {
  const values = Object.values(scores).filter((v): v is number => v !== null)
  if (values.length === 0) return null
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length
  return Math.round(avg * 100) / 100
}
