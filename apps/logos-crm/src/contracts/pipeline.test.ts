import { describe, expect, test } from 'vitest'

import {
  PIPELINES,
  canMoveToStage,
  defaultStageFor,
  findStage,
  isStageOf,
  pipelineKeys,
  pipelineList,
  stageKind,
  stageLabel,
} from './pipeline'

describe('pipeline catalogue', () => {
  test('every pipeline has at least one stage', () => {
    for (const pipeline of pipelineList) {
      expect(pipeline.stages.length).toBeGreaterThan(0)
    }
  })

  test('stage keys are unique within a pipeline', () => {
    for (const pipeline of pipelineList) {
      const keys = pipeline.stages.map((stage) => stage.key)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  test('every pipeline ends in a terminal stage', () => {
    for (const pipeline of pipelineList) {
      const terminal = pipeline.stages.filter((stage) => stage.kind !== 'open')
      expect(terminal.length).toBeGreaterThan(0)
    }
  })

  test('open stages sort before terminal ones', () => {
    for (const pipeline of pipelineList) {
      const openIndexes = pipeline.stages
        .map((stage, index) => (stage.kind === 'open' ? index : -1))
        .filter((index) => index >= 0)
      const lastOpen = Math.max(...openIndexes)
      const firstTerminal = pipeline.stages.findIndex(
        (stage) => stage.kind !== 'open'
      )
      expect(lastOpen).toBeLessThan(firstTerminal)
    }
  })

  test('the two pipelines share no stage keys', () => {
    const ecodev = new Set(PIPELINES.ecodev.stages.map((stage) => stage.key))
    const overlap = PIPELINES.movement.stages.filter((stage) =>
      ecodev.has(stage.key)
    )
    expect(overlap).toEqual([])
  })
})

describe('stage lookup', () => {
  test('finds a stage that belongs to the pipeline', () => {
    expect(findStage('ecodev', 'qualified')?.label).toBe('Qualified')
  })

  test('does not find a stage from the other pipeline', () => {
    expect(findStage('ecodev', 'training_call')).toBeUndefined()
    expect(isStageOf('ecodev', 'training_call')).toBe(false)
    expect(isStageOf('movement', 'training_call')).toBe(true)
  })

  test('keeps the emoji in the label and out of the key', () => {
    expect(stageLabel('ecodev', 'solution_eng')).toBe('Solution Eng 👀')
    expect(findStage('ecodev', 'solution_eng')?.key).toBe('solution_eng')
  })

  test('falls back to the raw key for an unknown stage', () => {
    expect(stageLabel('ecodev', 'retired_stage')).toBe('retired_stage')
    expect(stageKind('ecodev', 'retired_stage')).toBe('open')
  })

  test('parked is distinct from lost', () => {
    expect(stageKind('ecodev', 'archive')).toBe('parked')
    expect(stageKind('ecodev', 'lost')).toBe('lost')
    expect(stageKind('movement', 'redirected_final')).toBe('redirected')
  })
})

describe('stage moves', () => {
  test('allows any move within the pipeline, including a jump to won', () => {
    expect(canMoveToStage('ecodev', 'confirmed')).toBe(true)
    expect(canMoveToStage('ecodev', 'lead')).toBe(true)
  })

  test('refuses a stage from another pipeline', () => {
    expect(canMoveToStage('ecodev', 'elearning')).toBe(false)
    expect(canMoveToStage('movement', 'negotiation')).toBe(false)
  })

  test('refuses an unknown stage', () => {
    expect(canMoveToStage('ecodev', '')).toBe(false)
    expect(canMoveToStage('ecodev', 'Qualified')).toBe(false)
  })
})

describe('defaults', () => {
  test('each pipeline starts at its first stage', () => {
    expect(defaultStageFor('ecodev')).toBe('lead')
    expect(defaultStageFor('movement')).toBe('new_lead')
  })

  test('the catalogue covers every declared key', () => {
    expect(Object.keys(PIPELINES).sort()).toEqual([...pipelineKeys].sort())
  })
})
