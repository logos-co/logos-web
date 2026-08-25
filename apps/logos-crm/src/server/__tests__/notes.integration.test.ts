import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import type { ActorContext } from '@/server/auth'
import { createCase, updateCaseIntegration } from '@/server/case-repository'
import { db } from '@/server/db'
import { auditEvents } from '@/server/db/schema'
import { ServiceError } from '@/server/service-errors'
import { listTimeline } from '@/server/timeline-repository'
import {
  createActivity,
  deleteActivity,
  listActivities,
  updateActivity,
} from '@/server/work-repository'

import {
  createTestOrganisation,
  createTestUser,
  isIntegrationEnabled,
  resetDatabase,
} from './support/database'

describe.skipIf(!isIntegrationEnabled)('notes and timeline', () => {
  let author: ActorContext
  let other: ActorContext
  let caseId: string

  beforeEach(async () => {
    await resetDatabase()
    author = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    other = await createTestUser('Jon Bell', 'jon.bell@logos.co')
    const organisationId = await createTestOrganisation(
      'Cypherpunk Guild Berlin'
    )
    const record = await createCase(author, {
      title: 'Waku integration for guild messaging',
      pipeline: 'ecodev',
      stage: 'lead',
      priority: 'high',
      organisationId,
      personIds: [],
    })
    caseId = record.id
  })

  async function addNote(body: string) {
    return createActivity(author, {
      subjectType: 'case',
      subjectId: caseId,
      type: 'note',
      body,
    })
  }

  test('stores the markdown a coordinator typed, unchanged', async () => {
    const body = '## Call\n- **bold** point\n- [brief](https://example.org)'
    const note = await addNote(body)
    expect(note.body).toBe(body)
    expect(note.editedAt).toBeNull()
    expect(note.isDeleted).toBe(false)
  })

  test('an edit records who changed it and when', async () => {
    const note = await addNote('First draft.')

    const edited = await updateActivity(author, note.id, {
      body: 'Corrected draft.',
    })

    expect(edited.body).toBe('Corrected draft.')
    expect(edited.editedAt).not.toBeNull()
    expect(edited.editedBy?.displayName).toBe('Mara Chen')
  })

  test('the previous text survives in the audit trail', async () => {
    const note = await addNote('The guild runs 400 members.')
    await updateActivity(author, note.id, {
      body: 'The guild runs 40 members.',
    })

    const events = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.entityId, note.id))

    const edit = events.find((row) => row.action === 'activity.edited')
    expect(edit?.changes).toMatchObject({
      body: { from: 'The guild runs 400 members.' },
    })
  })

  test('only the author may edit or delete their note', async () => {
    const note = await addNote('Mine.')

    await expect(
      updateActivity(other, note.id, { body: 'Not mine.' })
    ).rejects.toThrow(ServiceError)
    await expect(deleteActivity(other, note.id)).rejects.toThrow(ServiceError)
  })

  test('a deleted note keeps its place but not its body', async () => {
    const note = await addNote('Something said in confidence.')
    const deleted = await deleteActivity(author, note.id)

    expect(deleted.isDeleted).toBe(true)
    expect(deleted.body).toBe('')

    const listed = await listActivities({
      subjectType: 'case',
      subjectId: caseId,
    })
    const found = listed.find((item) => item.id === note.id)
    expect(found?.isDeleted).toBe(true)
    expect(found?.body).toBe('')
  })

  test('a deleted note cannot be edited back into existence', async () => {
    const note = await addNote('Gone.')
    await deleteActivity(author, note.id)

    await expect(
      updateActivity(author, note.id, { body: 'Back.' })
    ).rejects.toThrow(ServiceError)
  })
})

describe.skipIf(!isIntegrationEnabled)('the merged timeline', () => {
  let actor: ActorContext
  let caseId: string
  let version: number

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    const organisationId = await createTestOrganisation(
      'Meshnet Node Collective'
    )
    const record = await createCase(actor, {
      title: 'Nomos testnet node cohort',
      pipeline: 'ecodev',
      stage: 'lead',
      priority: 'medium',
      organisationId,
      personIds: [],
    })
    caseId = record.id
    version = record.version
  })

  test('opens with the case being opened', async () => {
    const entries = await listTimeline({
      subjectType: 'case',
      subjectId: caseId,
    })

    expect(entries.at(-1)).toMatchObject({
      kind: 'status_changed',
      summary: 'opened the case',
    })
  })

  test('merges notes and derived events into one descending feed', async () => {
    await createActivity(actor, {
      subjectType: 'case',
      subjectId: caseId,
      type: 'note',
      body: 'Sent the operator requirements.',
    })
    await updateCaseIntegration(actor, caseId, {
      integrationStage: 'engaged',
      expectedVersion: version,
    })

    const entries = await listTimeline({
      subjectType: 'case',
      subjectId: caseId,
    })

    const kinds = entries.map((entry) => entry.kind)
    expect(kinds).toContain('note')
    expect(kinds).toContain('stage_changed')

    const times = entries.map((entry) => entry.occurredAt)
    expect([...times].sort().reverse()).toEqual(times)
  })

  test('carries the note body so the feed replaces the activity tab', async () => {
    await createActivity(actor, {
      subjectType: 'case',
      subjectId: caseId,
      type: 'note',
      body: '- one\n- two',
    })

    const entries = await listTimeline({
      subjectType: 'case',
      subjectId: caseId,
    })
    const note = entries.find((entry) => entry.kind === 'note')

    expect(note?.body).toBe('- one\n- two')
    // Editable from the feed, which is where somebody reads it and notices the
    // thing that needs correcting.
    expect(note?.activityId).not.toBeNull()
  })

  test('a deleted note stays in the feed without its body', async () => {
    const note = await createActivity(actor, {
      subjectType: 'case',
      subjectId: caseId,
      type: 'note',
      body: 'Retracted.',
    })
    await deleteActivity(actor, note.id)

    const entries = await listTimeline({
      subjectType: 'case',
      subjectId: caseId,
    })
    const found = entries.find((entry) => entry.activityId === note.id)

    expect(found?.isDeleted).toBe(true)
    expect(found?.body).toBeNull()
  })
})

describe.skipIf(!isIntegrationEnabled)('the integration track', () => {
  let actor: ActorContext
  let caseId: string
  let version: number

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Ada Ferreira', 'ada.ferreira@logos.co')
    const organisationId = await createTestOrganisation(
      'Meshnet Node Collective'
    )
    const record = await createCase(actor, {
      title: 'Nomos testnet node cohort',
      pipeline: 'ecodev',
      stage: 'qualified',
      priority: 'medium',
      organisationId,
      personIds: [],
    })
    caseId = record.id
    version = record.version
  })

  test('starts off the track, which is not the same as not started', async () => {
    const entries = await listTimeline({
      subjectType: 'case',
      subjectId: caseId,
    })
    expect(entries.some((entry) => entry.summary.includes('integration'))).toBe(
      false
    )
  })

  test('is set independently of the stage', async () => {
    const moved = await updateCaseIntegration(actor, caseId, {
      integrationStage: 'ready_for_integration',
      expectedVersion: version,
    })

    expect(moved.integrationStage).toBe('ready_for_integration')
    expect(moved.stage).toBe('qualified')
  })

  test('can be cleared back off the track', async () => {
    const set = await updateCaseIntegration(actor, caseId, {
      integrationStage: 'engaged',
      expectedVersion: version,
    })
    const cleared = await updateCaseIntegration(actor, caseId, {
      integrationStage: null,
      expectedVersion: set.version,
    })

    expect(cleared.integrationStage).toBeNull()
  })

  test('refuses a stale version', async () => {
    await updateCaseIntegration(actor, caseId, {
      integrationStage: 'engaged',
      expectedVersion: version,
    })

    await expect(
      updateCaseIntegration(actor, caseId, {
        integrationStage: 'regular_contact',
        expectedVersion: version,
      })
    ).rejects.toThrow(ServiceError)
  })

  test('writes no workflow history, because no stage moved', async () => {
    await updateCaseIntegration(actor, caseId, {
      integrationStage: 'engaged',
      expectedVersion: version,
    })

    const entries = await listTimeline({
      subjectType: 'case',
      subjectId: caseId,
    })
    const stageMoves = entries.filter(
      (entry) =>
        entry.kind === 'stage_changed' && !entry.summary.includes('integration')
    )
    expect(stageMoves).toEqual([])
  })
})
