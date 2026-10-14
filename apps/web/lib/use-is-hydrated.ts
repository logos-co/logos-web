import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * `false` during the static render and hydration, `true` afterwards. Lets a
 * component swap build-time values for viewer-specific ones (clock, timezone,
 * URL) without a hydration mismatch.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
