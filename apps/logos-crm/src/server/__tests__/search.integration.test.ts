import { beforeEach, describe, expect, test } from 'vitest'

import { searchQuerySchema, SEARCH_GROUP_LIMIT } from '@/contracts/search'
import type { ActorContext } from '@/server/auth'
import { createCase } from '@/server/case-repository'
import { db } from '@/server/db'
import { contactMethods, organisations, people } from '@/server/db/schema'
import { search } from '@/server/search-repository'

import {
  createTestUser,
  isIntegrationEnabled,
  resetDatabase,
} from './support/database'

async function addPerson(
  fullName: string,
  email?: string,
  roleTitle?: string
): Promise<string> {
  const [person] = await db
    .insert(people)
    .values({ fullName, roleTitle: roleTitle ?? null })
    .returning()

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

describe.skipIf(!isIntegrationEnabled)('global search', () => {
  let actor: ActorContext

  beforeEach(async () => {
    await resetDatabase()
    actor = await createTestUser('Mara Chen', 'mara.chen@logos.co')
  })

  test('finds a person by their email address', async () => {
    await addPerson('Amina Okafor', 'amina@opensystems.example')

    const result = await search('amina@opensystems')

    expect(result.people).toHaveLength(1)
    expect(result.people[0]?.title).toBe('Amina Okafor')
  })

  test('finds a person by name regardless of case', async () => {
    await addPerson('Amina Okafor', 'amina@opensystems.example')

    const result = await search('AMINA')

    expect(result.people).toHaveLength(1)
  })

  test('finds an organisation by its domain', async () => {
    await addOrganisation('Open Systems Lab', 'opensystems.example')

    const result = await search('opensystems.example')

    expect(result.organisations).toHaveLength(1)
    expect(result.organisations[0]?.subtitle).toBe('opensystems.example')
  })

  test('finds a case by its lead source', async () => {
    const organisationId = await addOrganisation('Cipher Commons')
    await createCase(actor, {
      title: 'Privacy tooling collaboration',
      stage: 'Intake',
      priority: 'medium',
      organisationId,
      personIds: [],
    })

    const byTitle = await search('privacy tooling')
    expect(byTitle.cases).toHaveLength(1)
    expect(byTitle.cases[0]?.subtitle).toBe('Cipher Commons')
  })

  test('finds a case through its organisation name', async () => {
    const organisationId = await addOrganisation('Nodecraft Collective')
    await createCase(actor, {
      title: 'Community node programme',
      stage: 'Proposal',
      priority: 'medium',
      organisationId,
      personIds: [],
    })

    const result = await search('nodecraft')

    expect(result.cases).toHaveLength(1)
    expect(result.organisations).toHaveLength(1)
  })

  test('groups results and totals them across kinds', async () => {
    const organisationId = await addOrganisation('Signal Works')
    await addPerson('Signal Tester', 'tester@signalworks.example')
    await createCase(actor, {
      title: 'Signal partnership',
      stage: 'Intake',
      priority: 'medium',
      organisationId,
      personIds: [],
    })

    const result = await search('signal')

    expect(result.cases).toHaveLength(1)
    expect(result.people).toHaveLength(1)
    expect(result.organisations).toHaveLength(1)
    expect(result.total).toBe(3)
  })

  test('caps each group so one kind cannot bury the others', async () => {
    for (let index = 0; index < SEARCH_GROUP_LIMIT + 3; index += 1) {
      await addPerson(`Repeated Name ${index}`)
    }

    const result = await search('Repeated Name')

    expect(result.people).toHaveLength(SEARCH_GROUP_LIMIT)
  })

  test('returns nothing rather than everything for an unmatched term', async () => {
    await addPerson('Amina Okafor', 'amina@opensystems.example')

    const result = await search('nobody-by-this-name')

    expect(result.total).toBe(0)
  })

  test('treats wildcard characters as literal text', async () => {
    await addPerson('Amina Okafor', 'amina@opensystems.example')

    // Unescaped, this would match every person in the table.
    const result = await search('%')

    expect(result.total).toBe(0)
  })
})

describe('search query contract', () => {
  test('rejects a query shorter than the minimum', () => {
    expect(searchQuerySchema.safeParse({ q: 'a' }).success).toBe(false)
  })

  test('rejects an empty query', () => {
    expect(searchQuerySchema.safeParse({ q: '   ' }).success).toBe(false)
  })

  test('trims a usable query', () => {
    expect(searchQuerySchema.parse({ q: '  amina  ' }).q).toBe('amina')
  })
})
