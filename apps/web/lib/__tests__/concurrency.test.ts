import { describe, expect, it } from 'vitest'

import { mapWithConcurrency } from '@/lib/concurrency'

describe('mapWithConcurrency', () => {
  it('keeps results in input order', async () => {
    const delays = [30, 5, 15, 0]

    const results = await mapWithConcurrency(
      delays,
      2,
      async (delay, index) => {
        await new Promise((resolve) => setTimeout(resolve, delay))
        return `${index}:${delay}`
      }
    )

    expect(results).toEqual(['0:30', '1:5', '2:15', '3:0'])
  })

  it('never runs more tasks at once than the limit', async () => {
    let running = 0
    let peak = 0

    await mapWithConcurrency(Array.from({ length: 10 }), 3, async () => {
      running += 1
      peak = Math.max(peak, running)
      await new Promise((resolve) => setTimeout(resolve, 2))
      running -= 1
    })

    expect(peak).toBe(3)
  })

  it('handles an empty list', async () => {
    await expect(mapWithConcurrency([], 4, async () => 1)).resolves.toEqual([])
  })

  it('rejects when a task fails', async () => {
    await expect(
      mapWithConcurrency([1, 2], 2, async (value) => {
        if (value === 2) throw new Error('boom')
        return value
      })
    ).rejects.toThrow('boom')
  })
})
