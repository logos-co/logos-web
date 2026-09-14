'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { FleetName, StorageNode } from '@/lib/storage-fleet'
import { FLEET_API, parseFleet } from '@/lib/storage-fleet'

export type FleetState = {
  nodes: StorageNode[]
  isLoading: boolean
  error: string | null
}

const INITIAL: FleetState = { nodes: [], isLoading: true, error: null }

/**
 * Reads a storage fleet roster through `/api/storage/fleet`.
 *
 * fleets.logos.co sends no CORS header, so the browser is not allowed to read
 * it directly. The route passes the roster through unchanged, which is why the
 * response is parsed here with `parseFleet`, the same parser either side.
 */
export function useStorageFleet(fleet: FleetName): FleetState {
  const [state, setState] = useState<FleetState>(INITIAL)

  // A slower earlier fleet must not overwrite the one now selected.
  const requestedRef = useRef<FleetName>(fleet)

  const load = useCallback(async (name: FleetName) => {
    requestedRef.current = name
    setState(INITIAL)

    try {
      const response = await fetch(FLEET_API(name))
      if (requestedRef.current !== name) return

      if (!response.ok) {
        setState({
          nodes: [],
          isLoading: false,
          error: `The roster answered ${response.status}.`,
        })
        return
      }

      setState({
        nodes: parseFleet(await response.json()),
        isLoading: false,
        error: null,
      })
    } catch {
      if (requestedRef.current !== name) return
      setState({
        nodes: [],
        isLoading: false,
        error: 'Could not reach the fleet roster.',
      })
    }
  }, [])

  useEffect(() => {
    void load(fleet)
  }, [fleet, load])

  return state
}
