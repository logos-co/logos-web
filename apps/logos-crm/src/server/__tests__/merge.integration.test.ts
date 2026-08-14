import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, test } from 'vitest'

import type { ActorContext } from '@/server/auth'
import { createCase } from '@/server/case-repository'
import { db } from '@/server/db'
import {
  auditEvents,
  casePeople,
  contactMethods,
  entityMerges,
  externalIdentities,
  organisations,
  people,
  personOrganisationRelationships,
} from '@/server/db/schema'
import {
  findDuplicateOrganisations,
  findDuplicatePeople,
  mergeOrganisations,
  mergePeople,
} from '@/server/merge-repository'

import {
  createTestUser,
  isIntegrationEnabled,
  resetDatabase,
} from './support/database'

async function addPerson(fullName: string, email?: string): Promise<string> {
  const [person] = await db.insert(people).values({ fullName }).returning()
  if (!person) throw new Error('The test person was not created.')

  if (email) {
    await db.insert(contactMethods).values({
      personId: person.id,
      type: 'email',
      displayValue: email,
      normalisedValue: email.toLocaleLowerCase('en'),
      isPreferred: true,
    })
  }

  return person.id
}

async function addOrganisation(
  displayName: string,
  domain?: string
): Promise<string> {
  const [organisation] = await db
    .insert(organisations)
    .values({
      displayName,
      normalisedName: displayName.toLocaleLowerCase('en'),
      domain: domain ?? null,
    })
    .returning()

  if (!organisation) throw new Error('The test organisation was not created.')
  return organisation.id
}

describe.skipIf(!isIntegrationEnabled)('duplicate suggestions', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  test('suggests a person sharing an email address', async () => {
    const first = await addPerson('Amina Okafor', 'amina@opensystems.example')
    const second = await addPerson('A. Okafor', 'amina@opensystems.example')

    const suggestions = await findDuplicatePeople(first)

    expect(suggestions).toHaveLength(1)
    expect(suggestions[0]?.id).toBe(second)
    expect(suggestions[0]?.reason).toBe('same_email')
  })

  test('suggests a person sharing a name', async () => {
    const first = await addPerson('Amina Okafor', 'amina@one.example')
    await addPerson('amina okafor', 'amina@two.example')

    const suggestions = await findDuplicatePeople(first)

    expect(suggestions).toHaveLength(1)
    expect(suggestions[0]?.reason).toBe('same_name')
  })

  test('suggests nothing for a person with no twin', async () => {
    const first = await addPerson('Amina Okafor', 'amina@opensystems.example')
    await addPerson('Leo Martin', 'leo@nodecraft.example')

    expect(await findDuplicatePeople(first)).toHaveLength(0)
  })

  test('suggests an organisation sharing a domain', async () => {
    const first = await addOrganisation(
      'Open Systems Lab',
      'opensystems.example'
    )
    const second = await addOrganisation('OpenSystems', 'opensystems.example')

    const suggestions = await findDuplicateOrganisations(first)

    expect(suggestions.map((item) => item.id)).toEqual([second])
    expect(suggestions[0]?.reason).toBe('same_domain')
  })

  test('stops suggesting a record once it has been merged away', async () => {
    const actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
    const survivor = await addPerson(
      'Amina Okafor',
      'amina@opensystems.example'
    )
    const duplicate = await addPerson('A. Okafor', 'amina@opensystems.example')

    expect(await findDuplicatePeople(survivor)).toHaveLength(1)

    await mergePeople(actor, { survivorId: survivor, duplicateId: duplicate })

    expect(await findDuplicatePeople(survivor)).toHaveLength(0)
  })
})

describe.skipIf(!isIntegrationEnabled)('merging people', () => {
  let actor: ActorContext

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
  })

  test('moves contact methods to the survivor', async () => {
    const survivor = await addPerson('Amina Okafor', 'amina@one.example')
    const duplicate = await addPerson('A. Okafor', 'amina@two.example')

    await mergePeople(actor, { survivorId: survivor, duplicateId: duplicate })

    const methods = await db
      .select()
      .from(contactMethods)
      .where(eq(contactMethods.personId, survivor))

    expect(methods).toHaveLength(2)
  })

  test('moves case links without duplicating an existing one', async () => {
    const organisationId = await addOrganisation('Open Systems Lab')
    const survivor = await addPerson('Amina Okafor')
    const duplicate = await addPerson('A. Okafor')

    const shared = await createCase(actor, {
      title: 'Shared case',
      stage: 'Intake',
      priority: 'medium',
      organisationId,
      personIds: [survivor],
    })
    const other = await createCase(actor, {
      title: 'Duplicate only',
      stage: 'Intake',
      priority: 'medium',
      organisationId,
      personIds: [duplicate],
    })
    // Both records are on the same case, which is exactly the collision a naive
    // move would abort on.
    await db
      .insert(casePeople)
      .values({ caseId: shared.id, personId: duplicate })

    await mergePeople(actor, { survivorId: survivor, duplicateId: duplicate })

    const links = await db
      .select()
      .from(casePeople)
      .where(eq(casePeople.personId, survivor))

    expect(links.map((link) => link.caseId).sort()).toEqual(
      [shared.id, other.id].sort()
    )
    expect(
      await db
        .select()
        .from(casePeople)
        .where(eq(casePeople.personId, duplicate))
    ).toHaveLength(0)
  })

  test('moves organisation relationships and drops the colliding one', async () => {
    const organisationId = await addOrganisation('Open Systems Lab')
    const survivor = await addPerson('Amina Okafor')
    const duplicate = await addPerson('A. Okafor')

    await db.insert(personOrganisationRelationships).values([
      { personId: survivor, organisationId },
      { personId: duplicate, organisationId },
    ])

    await mergePeople(actor, { survivorId: survivor, duplicateId: duplicate })

    const relationships = await db
      .select()
      .from(personOrganisationRelationships)
      .where(eq(personOrganisationRelationships.personId, survivor))

    expect(relationships).toHaveLength(1)
  })

  test('moves external identities so a later import finds the survivor', async () => {
    const survivor = await addPerson('Amina Okafor')
    const duplicate = await addPerson('A. Okafor')

    await db.insert(externalIdentities).values({
      sourceSystem: 'notion',
      entityType: 'person',
      entityId: duplicate,
      sourceId: 'notion:page-1',
    })

    await mergePeople(actor, { survivorId: survivor, duplicateId: duplicate })

    const [identity] = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.sourceId, 'notion:page-1'))

    expect(identity?.entityId).toBe(survivor)
  })

  test('archives the duplicate rather than deleting it', async () => {
    const survivor = await addPerson('Amina Okafor')
    const duplicate = await addPerson('A. Okafor')

    await mergePeople(actor, { survivorId: survivor, duplicateId: duplicate })

    const [archived] = await db
      .select()
      .from(people)
      .where(eq(people.id, duplicate))

    expect(archived?.status).toBe('inactive')
  })

  test('records the merge and audits it', async () => {
    const survivor = await addPerson('Amina Okafor')
    const duplicate = await addPerson('A. Okafor')

    await mergePeople(actor, {
      survivorId: survivor,
      duplicateId: duplicate,
      reason: 'Same person, two submissions.',
    })

    const [merge] = await db
      .select()
      .from(entityMerges)
      .where(eq(entityMerges.mergedId, duplicate))
    const events = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.entityId, survivor))

    expect(merge?.survivorId).toBe(survivor)
    expect(merge?.reason).toBe('Same person, two submissions.')
    expect(events.some((event) => event.action === 'person.merged')).toBe(true)
  })

  test('refuses to merge a record into itself', async () => {
    const person = await addPerson('Amina Okafor')

    await expect(
      mergePeople(actor, { survivorId: person, duplicateId: person })
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  test('refuses when one of the records is gone', async () => {
    const survivor = await addPerson('Amina Okafor')

    await expect(
      mergePeople(actor, {
        survivorId: survivor,
        duplicateId: '00000000-0000-4000-8000-000000000000',
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe.skipIf(!isIntegrationEnabled)('merging organisations', () => {
  let actor: ActorContext

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
  })

  test('moves case links and archives the duplicate', async () => {
    const survivor = await addOrganisation('Open Systems Lab', 'os.example')
    const duplicate = await addOrganisation('OpenSystems', 'os.example')

    await createCase(actor, {
      title: 'Duplicate organisation case',
      stage: 'Intake',
      priority: 'medium',
      organisationId: duplicate,
      personIds: [],
    })

    await mergeOrganisations(actor, {
      survivorId: survivor,
      duplicateId: duplicate,
    })

    const [archived] = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, duplicate))
    const suggestions = await findDuplicateOrganisations(survivor)

    expect(archived?.status).toBe('inactive')
    expect(suggestions).toHaveLength(0)
  })
})
