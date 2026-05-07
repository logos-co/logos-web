/**
 * Reward formatting helpers shared by Ideas and RFPs surfaces in the
 * Builders Hub. Both domains carry the same `{ amount, currency, xp? }` shape
 * but rendered slightly differently — single-line for inline copy, multi-line
 * for table rows.
 */

export type Reward = {
  amount: number
  currency: string
  xp?: number
}

/**
 * One-line reward summary, e.g. `"2500 USDC + 1000 XP"` or `"2500 USDC"`.
 * Returns `null` when the reward is missing so callers can omit the slot.
 */
export function formatReward(reward: Reward | undefined): string | null {
  if (!reward) return null
  const amount = `${reward.amount} ${reward.currency}`
  return reward.xp ? `${amount} + ${reward.xp} XP` : amount
}

/**
 * Two-line reward summary used by the Ideas/RFPs table rows where the amount
 * and bonus XP each live on their own line. Empty array signals "no reward".
 */
export function formatRewardLines(reward: Reward | undefined): string[] {
  if (!reward) return []
  const amount = `${reward.amount} ${reward.currency}`
  return reward.xp ? [amount, `+ ${reward.xp} XP`] : [amount]
}
