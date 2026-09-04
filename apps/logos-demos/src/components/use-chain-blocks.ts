'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { BlockSummary } from '@/lib/blockchain'
import { parseSummaries } from '@/lib/blockchain'

/** Blocks arrive about once a minute, so polling faster only adds noise. */
const POLL_INTERVAL_MS = 15000

export type ChainState = {
  blocks: BlockSummary[]
  fetchedAt: number | null
  isLoading: boolean
  error: string | null
}

const INITIAL: ChainState = {
  blocks: [],
  fetchedAt: null,
  isLoading: true,
  error: null,
}

/**
 * Polls this app's proxy for recent blocks.
 *
 * Unlike the messaging demo, this one does not talk to the network itself: the
 * explorer sends no CORS headers, so the request goes through our route
 * handler. See src/app/api/blockchain/blocks/route.ts.
 */
export function useChainBlocks() {
  const [state, setState] = useState<ChainState>(INITIAL)
  const isMountedRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/blockchain/blocks')
      const payload: unknown = await response.json()

      if (!isMountedRef.current) return

      if (!response.ok) {
        const message =
          typeof payload === 'object' &&
          payload !== null &&
          typeof (payload as { error?: unknown }).error === 'string'
            ? (payload as { error: string }).error
            : 'Could not load blocks.'
        setState((current) => ({ ...current, isLoading: false, error: message }))
        return
      }

      const { blocks, fetchedAt } = payload as Record<string, unknown>
      setState({
        blocks: parseSummaries(blocks),
        fetchedAt: typeof fetchedAt === 'number' ? fetchedAt : Date.now(),
        isLoading: false,
        error: null,
      })
    } catch {
      if (!isMountedRef.current) return
      setState((current) => ({
        ...current,
        isLoading: false,
        error: 'Could not load blocks.',
      }))
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    void load()
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS)

    return () => {
      isMountedRef.current = false
      clearInterval(timer)
    }
  }, [load])

  return state
}
