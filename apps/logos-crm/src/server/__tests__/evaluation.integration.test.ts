import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import { recordDecisionSchema } from '@/contracts/evaluation'
import type { ActorContext } from '@/server/auth'
import { createCase, listCases } from '@/server/case-repository'
import { db } from '@/server/db'
import { auditEvents, caseEvaluations } from '@/server/db/schema'
import {
  getEvaluationSummary,
  recordDecision,
  recordEvaluation,
} from '@/server/evaluation-repository'

import {
  createTestOrganisation,
  createTestUser,
  isIntegrationEnabled,
  resetDatabase,
} from './support/database'

describe.skipIf(!isIntegrationEnabled)('case evaluation', () => {
  let actor: ActorContext
  let organisationId: string

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    organisationId = await createTestOrganisation('Open Systems Lab')
  })

  async function openCase() {
    return createCase(actor, {
      title: 'Coalition Partner - Amina Okafor',
      pipeline: 'ecodev' as const,
      stage: 'lead',
      priority: 'medium',
      organisationId,
      personIds: [],
    })
  }

  test('records a stage with its reviewer and rubric version', async () => {
    const record = await openCase()

    const summary = await recordEvaluation(actor, record.id, {
      stage: 'submission',
      score: 4,
      notes: 'Strong alignment, unclear capacity.',
    })

    expect(summary.stages).toHaveLength(1)
    expect(summary.stages[0]?.score).toBe(4)
    expect(summary.stages[0]?.reviewer?.displayName).toBe('Mara Chen')
    expect(summary.stages[0]?.criteriaVersion).toBe('intake-v1')
  })

  test('averages only the stages that were scored', async () => {
    const record = await openCase()

    await recordEvaluation(actor, record.id, { stage: 'submission', score: 4 })
    await recordEvaluation(actor, record.id, { stage: 'call', score: 3 })
    await recordEvaluation(actor, record.id, {
      stage: 'one_pager',
      notes: 'Too early to score.',
    })

    const summary = await getEvaluationSummary(record.id)

    expect(summary.scoredCount).toBe(2)
    expect(summary.averageScore).toBe(3.5)
  })

  test('reports no average before anything is scored', async () => {
    const record = await openCase()
    await recordEvaluation(actor, record.id, {
      stage: 'submission',
      notes: 'Read it, no judgement yet.',
    })

    const summary = await getEvaluationSummary(record.id)

    expect(summary.averageScore).toBeNull()
    expect(summary.scoredCount).toBe(0)
  })

  test('re-reviewing a stage replaces it instead of duplicating', async () => {
    const record = await openCase()

    await recordEvaluation(actor, record.id, { stage: 'call', score: 2 })
    const summary = await recordEvaluation(actor, record.id, {
      stage: 'call',
      score: 5,
      notes: 'Second call went far better.',
    })

    const rows = await db
      .select()
      .from(caseEvaluations)
      .where(eq(caseEvaluations.caseId, record.id))

    expect(rows).toHaveLength(1)
    expect(summary.stages[0]?.score).toBe(5)
  })

  test('audits every evaluation with the score change', async () => {
    const record = await openCase()
    await recordEvaluation(actor, record.id, { stage: 'submission', score: 4 })

    const events = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.entityId, record.id))

    const evaluationEvent = events.find(
      (event) => event.action === 'case.evaluation_recorded'
    )
    expect(evaluationEvent?.actorUserId).toBe(actor.userId)
    expect(evaluationEvent?.changes).toMatchObject({
      score: { from: null, to: 4 },
    })
  })

  test('records a decision with its reason and author', async () => {
    const record = await openCase()

    const decided = await recordDecision(actor, record.id, {
      decision: 'approved',
      reason: 'Clear fit for the coalition track.',
      expectedVersion: record.version,
    })

    expect(decided.decision).toBe('approved')
    expect(decided.decisionReason).toBe('Clear fit for the coalition track.')
    expect(decided.decidedAt).not.toBeNull()
  })

  test('rejects a decision submitted from a stale screen', async () => {
    const record = await openCase()
    await recordDecision(actor, record.id, {
      decision: 'approved',
      reason: 'First decision.',
      expectedVersion: record.version,
    })

    await expect(
      recordDecision(actor, record.id, {
        decision: 'declined',
        reason: 'Second decision from an old page.',
        expectedVersion: record.version,
      })
    ).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  test('requires a reason for any decision that is not pending', () => {
    const parsed = recordDecisionSchema.safeParse({
      decision: 'redirected',
      expectedVersion: 1,
    })

    expect(parsed.success).toBe(false)
  })

  test('needs_review holds evaluated cases that nobody decided', async () => {
    const evaluated = await openCase()
    await openCase()

    expect(
      await listCases({ queue: 'needs_review' }, actor.userId)
    ).toHaveLength(0)

    await recordEvaluation(actor, evaluated.id, {
      stage: 'submission',
      score: 4,
    })

    const items = await listCases({ queue: 'needs_review' }, actor.userId)
    expect(items.map((item) => item.id)).toEqual([evaluated.id])
  })

  test('deciding a case clears it from needs_review', async () => {
    const record = await openCase()
    await recordEvaluation(actor, record.id, { stage: 'submission', score: 4 })

    const [pending] = await listCases({ queue: 'needs_review' }, actor.userId)
    expect(pending?.id).toBe(record.id)

    await recordDecision(actor, record.id, {
      decision: 'redirected',
      reason: 'Better served by the builder track.',
      expectedVersion: pending?.version ?? record.version,
    })

    expect(
      await listCases({ queue: 'needs_review' }, actor.userId)
    ).toHaveLength(0)
  })
})
