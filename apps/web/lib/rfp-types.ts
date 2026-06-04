import type { MediaRef } from '@repo/content/schemas'

import type { Reward } from '@/lib/reward'

/**
 * Minimal RFP shape the listing surfaces (card + table row) actually read.
 *
 * Both data sources satisfy this:
 *   - Local content `Rfp` (`RFPIndex & RFPLocale`) is a structural superset.
 *   - GitHub-sourced RFPs (`GithubRfp`) omit `reward`/`image`, which is why
 *     those fields are optional here — the UI hides whatever is absent.
 */
export type RfpListItem = {
  slug: string
  title: string
  tagline?: string
  summary: string
  image?: MediaRef
  reward?: Reward
}
