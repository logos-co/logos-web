'use client'

import { useCallback, useRef, useState } from 'react'

import type { SearchResults } from '@/lib/blockchain'
import { EMPTY_RESULTS, parseSearchPayload } from '@/lib/blockchain'

export type SearchState = {
  query: string
  results: SearchResults
  isSearching: boolean
  error: string | null
  /** True once a search has returned, so "nothing found" can be told from "not asked". */
  hasSearched: boolean
}

const INITIAL: SearchState = {
  query: '',
  results: EMPTY_RESULTS,
  isSearching: false,
  error: null,
  hasSearched: false,
}

export function useChainSearch() {
  const [state, setState] = useState<SearchState>(INITIAL)

  // Typing fast enough to overlap requests would otherwise let an older answer
  // land after a newer one and win.
  const latestQueryRef = useRef('')

  const search = useCallback(async (query: string) => {
    const trimmed = query.trim()
    latestQueryRef.current = trimmed

    if (!trimmed) {
      setState(INITIAL)
      return
    }

    setState((current) => ({
      ...current,
      query: trimmed,
      isSearching: true,
      error: null,
    }))

    try {
      const response = await fetch(
        `/api/blockchain/search?q=${encodeURIComponent(trimmed)}`,
      )
      const payload: unknown = await response.json()

      // A slower earlier request is no longer the answer to anything.
      if (latestQueryRef.current !== trimmed) return

      if (!response.ok) {
        const message =
          typeof payload === 'object' &&
          payload !== null &&
          typeof (payload as { error?: unknown }).error === 'string'
            ? (payload as { error: string }).error
            : 'Search failed.'
        setState((current) => ({
          ...current,
          isSearching: false,
          error: message,
          hasSearched: true,
        }))
        return
      }

      setState({
        query: trimmed,
        results: parseSearchPayload(payload),
        isSearching: false,
        error: null,
        hasSearched: true,
      })
    } catch {
      if (latestQueryRef.current !== trimmed) return
      setState((current) => ({
        ...current,
        isSearching: false,
        error: 'Search failed.',
        hasSearched: true,
      }))
    }
  }, [])

  const clear = useCallback(() => {
    latestQueryRef.current = ''
    setState(INITIAL)
  }, [])

  return { ...state, search, clear }
}
