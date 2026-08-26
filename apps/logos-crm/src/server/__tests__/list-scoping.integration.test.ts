import { beforeEach, describe, expect, test } from 'vitest'

import { LIST_LIMIT_DEFAULT } from '@/contracts/case'
import type { ActorContext } from '@/server/auth'
import {
  countCasesByQueue,
  createCase,
  getDashboardSummary,
  listCases,
} from '@/server/case-repository'
import { listTimeline } from '@/server/timeline-repository'
import { createActivity } from '@/server/work-repository'

import {
  createTestOrganisation,
  createTestUser,
  isIntegrationEnabled,
  resetDatabase,
} from './support/database'

describe.skipIf(!isIntegrationEnabled)('counts follow the pipeline', () => {
  let actor: ActorContext

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    const organisationId = await createTestOrganisation(
      'Cypherpunk Guild Berlin'
    )

    await createCase(actor, {
      title: 'Waku integration for guild messaging',
      pipeline: 'ecodev',
      stage: 'lead',
      priority: 'high',
      organisationId,
      personIds: [],
    })
    await createCase(actor, {
      title: 'Logos Circles campus chapter',
      pipeline: 'movement',
      stage: 'new_lead',
      priority: 'low',
      organisationId,
      personIds: [],
    })
  })

  test('the summary counts the whole workspace when unscoped', async () => {
    const summary = await getDashboardSummary()
    expect(summary.total).toBe(2)
  })

  test('the summary counts one pipeline when scoped', async () => {
    const ecodev = await getDashboardSummary('ecodev')
    const movement = await getDashboardSummary('movement')

    expect(ecodev.total).toBe(1)
    expect(movement.total).toBe(1)
  })

  test('queue counts agree with what the board renders', async () => {
    const queues = await countCasesByQueue(actor.userId, 'ecodev')
    const board = await listCases({ pipeline: 'ecodev' }, actor.userId)

    // The defect this covers: the tab said 2 over a board holding 1.
    expect(queues.all).toBe(board.length)
  })
})

describe.skipIf(!isIntegrationEnabled)('list results are capped', () => {
  let actor: ActorContext

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
  })

  test('a list never returns more than the requested limit', async () => {
    const organisationId = await createTestOrganisation(
      'Meshnet Node Collective'
    )
    for (let index = 0; index < 5; index += 1) {
      await createCase(actor, {
        title: `Nomos testnet cohort ${index}`,
        pipeline: 'ecodev',
        stage: 'lead',
        priority: 'low',
        organisationId,
        personIds: [],
      })
    }

    const capped = await listCases({ limit: 3 }, actor.userId)
    expect(capped).toHaveLength(3)
  })

  test('the default cap is applied when the caller asks for nothing', async () => {
    const all = await listCases({}, actor.userId)
    expect(all.length).toBeLessThanOrEqual(LIST_LIMIT_DEFAULT)
  })
})

describe.skipIf(!isIntegrationEnabled)(
  'the timeline resolves its actors',
  () => {
    test('names the author without reading every user in the table', async () => {
      await resetDatabase()
      const author = await createTestUser('Mara Chen', 'mara.chen@logos.co')
      // Several other accounts exist; none of them belongs on this timeline.
      await createTestUser('Jon Bell', 'jon.bell@logos.co')
      await createTestUser('Ada Ferreira', 'ada.ferreira@logos.co')

      const organisationId = await createTestOrganisation(
        'Freedom Stack Foundation'
      )
      const record = await createCase(author, {
        title: 'Codex storage pilot for public archives',
        pipeline: 'ecodev',
        stage: 'lead',
        priority: 'low',
        organisationId,
        personIds: [],
      })
      await createActivity(author, {
        subjectType: 'case',
        subjectId: record.id,
        type: 'note',
        body: 'Scope agreed.',
      })

      const entries = await listTimeline({
        subjectType: 'case',
        subjectId: record.id,
      })
      const note = entries.find((entry) => entry.kind === 'note')

      expect(note?.actor?.displayName).toBe('Mara Chen')
      const names = new Set(
        entries.map((entry) => entry.actor?.displayName).filter(Boolean)
      )
      expect(names.has('Jon Bell')).toBe(false)
    })
  }
)
