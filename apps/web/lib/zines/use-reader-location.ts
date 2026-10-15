'use client'

import { useSyncExternalStore } from 'react'
import { readState, type ReaderState } from './reader-state'

const CHANGE_EVENT = 'zine-location-change'
const subscribe = (listener: () => void): (() => void) => {
  window.addEventListener('popstate', listener)
  window.addEventListener(CHANGE_EVENT, listener)
  return () => {
    window.removeEventListener('popstate', listener)
    window.removeEventListener(CHANGE_EVENT, listener)
  }
}
const snapshot = (): string => window.location.search
const serverSnapshot = (): string => ''
const mobileSnapshot = (): boolean =>
  window.matchMedia('(max-width: 767px)').matches
const subscribeMobile = (listener: () => void): (() => void) => {
  const media = window.matchMedia('(max-width: 767px)')
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

export function useReaderLocation(pageCount: number): {
  state: ReaderState
  mobile: boolean
  navigate: (patch: Partial<ReaderState>, replace?: boolean) => void
} {
  const search = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const mobile = useSyncExternalStore(
    subscribeMobile,
    mobileSnapshot,
    () => false
  )
  const state = readState(search, pageCount)
  const navigate = (patch: Partial<ReaderState>, replace = false): void => {
    const url = new URL(window.location.href)
    const next = { ...readState(url.search, pageCount), ...patch }
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === '' || (key === 'block' && value === 0))
        url.searchParams.delete(key === 'query' ? 'q' : key)
      else url.searchParams.set(key === 'query' ? 'q' : key, String(value))
    }
    window.history[replace ? 'replaceState' : 'pushState'](null, '', url)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }
  return { state, mobile, navigate }
}
