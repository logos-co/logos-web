import { describe, expect, it } from 'vitest'

import { getNodeBoot } from '../use-node-boot'

describe('getNodeBoot', () => {
  it('shows the node as not started at the beginning of the loop', () => {
    expect(getNodeBoot(0)).toEqual({
      isStarted: false,
      isOnline: false,
      doneStages: 0,
    })
  })

  it('marks Started done while the node is still coming online', () => {
    expect(getNodeBoot(10)).toEqual({
      isStarted: true,
      isOnline: false,
      doneStages: 1,
    })
  })

  it('goes online once the Online stage is done', () => {
    expect(getNodeBoot(22)).toEqual({
      isStarted: true,
      isOnline: true,
      doneStages: 2,
    })
  })

  it('holds on Aging as the current stage until the loop restarts', () => {
    expect(getNodeBoot(34).doneStages).toBe(3)
    expect(getNodeBoot(100).doneStages).toBe(3)
  })
})
