'use client'

import { useEffect, useState } from 'react'

// Timing matches the Tech Overview design artifact: a 90ms tick that loops
// 0–100, so the node boots through its stages roughly every 9 seconds.
const TICK_MS = 90
const CYCLE_TICKS = 101
const STARTED_AT_TICK = 10
const TICKS_PER_STAGE = 12
const MAX_DONE_STAGES = 3
const ONLINE_STAGE = 2

export interface NodeBoot {
  isStarted: boolean
  isOnline: boolean
  /** Number of stages shown as done; the next stage is the current one. */
  doneStages: number
}

export function getNodeBoot(tick: number): NodeBoot {
  if (tick < STARTED_AT_TICK) {
    return { isStarted: false, isOnline: false, doneStages: 0 }
  }
  const doneStages = Math.min(
    MAX_DONE_STAGES,
    Math.floor((tick - STARTED_AT_TICK) / TICKS_PER_STAGE) + 1
  )
  return { isStarted: true, isOnline: doneStages >= ONLINE_STAGE, doneStages }
}

/** Replays the node start-up stages while the demo node is running. */
export function useNodeBoot(isRunning: boolean): NodeBoot {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isRunning) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTick(CYCLE_TICKS - 1)
      return
    }
    setTick(0)
    const interval = window.setInterval(
      () => setTick((current) => (current + 1) % CYCLE_TICKS),
      TICK_MS
    )
    return () => window.clearInterval(interval)
  }, [isRunning])

  return getNodeBoot(tick)
}
