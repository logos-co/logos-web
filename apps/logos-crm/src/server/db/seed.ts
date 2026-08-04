import { count } from 'drizzle-orm'

import { db, pool } from './index'
import * as schema from './schema'

const day = 24 * 60 * 60 * 1000
const now = Date.now()

const organisationSeeds = [
  [
    'Open Systems Lab',
    'opensystems.example',
    'Research infrastructure and open protocol engineering.',
  ],
  [
    'Nodecraft Collective',
    'nodecraft.example',
    'Community-operated infrastructure and node education.',
  ],
  [
    'Cipher Commons',
    'ciphercommons.example',
    'Privacy tooling research and public-interest deployment.',
  ],
  [
    'Assembly School',
    'assemblyschool.example',
    'Developer education and technical community programmes.',
  ],
  [
    'Moss Studio',
    'mossstudio.example',
    'Local-first product and interaction design practice.',
  ],
  [
    'Independent',
    null,
    'Independent researchers and unaffiliated contributors.',
  ],
] as const

await db
  .insert(schema.organisations)
  .values(
    organisationSeeds.map(([displayName, domain, summary], index) => ({
      displayName,
      normalisedName: displayName.toLocaleLowerCase('en'),
      domain,
      website: domain ? `https://${domain}` : null,
      status: index < 4 ? ('active' as const) : ('prospect' as const),
      summary,
      sourceSystem: 'demo',
      externalId: `organisation-${index + 1}`,
    }))
  )
  .onConflictDoNothing()

const organisationRows = await db.select().from(schema.organisations)
const organisationByName = new Map(
  organisationRows.map((row) => [row.displayName, row])
)

const personSeeds = [
  [
    'Amina Okafor',
    'Research director',
    'Open Systems Lab',
    'amina@opensystems.example',
  ],
  [
    'Leo Martin',
    'Infrastructure lead',
    'Nodecraft Collective',
    'leo@nodecraft.example',
  ],
  [
    'Sora Kim',
    'Privacy researcher',
    'Cipher Commons',
    'sora@ciphercommons.example',
  ],
  [
    'Iris Patel',
    'Programme director',
    'Assembly School',
    'iris@assemblyschool.example',
  ],
  ['Tomas Vale', 'Product lead', 'Moss Studio', 'tomas@mossstudio.example'],
  ['Rae Morgan', 'Independent researcher', 'Independent', 'rae@example.org'],
] as const

await db
  .insert(schema.people)
  .values(
    personSeeds.map(([fullName, roleTitle], index) => ({
      fullName,
      roleTitle,
      status: index < 4 ? ('active' as const) : ('prospect' as const),
      summary: `Primary coordination contact for ${personSeeds[index]?.[2]}.`,
      sourceSystem: 'demo',
      externalId: `person-${index + 1}`,
    }))
  )
  .onConflictDoNothing()

const personRows = await db.select().from(schema.people)
const personByExternalId = new Map(
  personRows.map((row) => [row.externalId, row])
)
const existingMethods = await db.select().from(schema.contactMethods)
const existingMethodKeys = new Set(
  existingMethods.map(
    (row) => `${row.personId}:${row.type}:${row.normalisedValue}`
  )
)
const contactValues = personSeeds.flatMap(([, , , email], index) => {
  const person = personByExternalId.get(`person-${index + 1}`)
  if (!person) return []
  const key = `${person.id}:email:${email}`
  return existingMethodKeys.has(key)
    ? []
    : [
        {
          personId: person.id,
          type: 'email' as const,
          displayValue: email,
          normalisedValue: email,
          label: 'Work',
          isPreferred: true,
        },
      ]
})
if (contactValues.length > 0) {
  await db.insert(schema.contactMethods).values(contactValues)
}

const relationshipValues = personSeeds.flatMap(
  ([, roleTitle, organisationName], index) => {
    const person = personByExternalId.get(`person-${index + 1}`)
    const organisation = organisationByName.get(organisationName)
    return person && organisation
      ? [
          {
            personId: person.id,
            organisationId: organisation.id,
            title: roleTitle,
            isPrimary: true,
          },
        ]
      : []
  }
)
if (relationshipValues.length > 0) {
  await db
    .insert(schema.personOrganisationRelationships)
    .values(relationshipValues)
    .onConflictDoNothing()
}

const [caseResult] = await db.select({ value: count() }).from(schema.cases)
if (caseResult?.value === 0) {
  await db.insert(schema.cases).values([
    {
      title: 'Protocol research partnership',
      organisation: 'Open Systems Lab',
      owner: 'Mara Chen',
      status: 'in_progress',
      stage: 'Qualification',
      priority: 'high',
      nextAction: 'Confirm technical discovery session',
      nextActionAt: new Date(now + day),
      lastContactAt: new Date(now - day),
    },
    {
      title: 'Community node programme',
      organisation: 'Nodecraft Collective',
      owner: 'Jon Bell',
      status: 'waiting',
      stage: 'Proposal',
      priority: 'medium',
      nextAction: 'Review hosting requirements',
      nextActionAt: new Date(now + day * 3),
      lastContactAt: new Date(now - day * 4),
    },
    {
      title: 'Privacy tooling collaboration',
      organisation: 'Cipher Commons',
      owner: 'Mara Chen',
      status: 'new',
      stage: 'Intake',
      priority: 'high',
      nextAction: 'Assign a technical coordinator',
      nextActionAt: new Date(now),
      lastContactAt: null,
    },
    {
      title: 'Developer education series',
      organisation: 'Assembly School',
      owner: 'Niko Reyes',
      status: 'resolved',
      stage: 'Approved',
      priority: 'low',
      nextAction: 'Archive final programme notes',
      nextActionAt: new Date(now + day * 7),
      lastContactAt: new Date(now - day * 2),
    },
    {
      title: 'Local-first tooling pilot',
      organisation: 'Moss Studio',
      owner: 'Jon Bell',
      status: 'in_progress',
      stage: 'Discovery',
      priority: 'medium',
      nextAction: 'Share integration brief',
      nextActionAt: new Date(now + day * 2),
      lastContactAt: new Date(now - day * 3),
    },
    {
      title: 'Research grants intake',
      organisation: 'Independent',
      owner: 'Niko Reyes',
      status: 'closed',
      stage: 'Redirected',
      priority: 'low',
      nextAction: 'No further action',
      nextActionAt: new Date(now + day * 30),
      lastContactAt: new Date(now - day * 14),
    },
  ])
}

const cases = await db.select().from(schema.cases)
for (const [index, personSeed] of personSeeds.entries()) {
  const person = personByExternalId.get(`person-${index + 1}`)
  const organisation = organisationByName.get(personSeed[2])
  const linkedCase = cases.find((item) => item.organisation === personSeed[2])
  if (!person || !organisation || !linkedCase) continue

  await db
    .insert(schema.caseOrganisations)
    .values({
      caseId: linkedCase.id,
      organisationId: organisation.id,
      isPrimary: true,
    })
    .onConflictDoNothing()
  await db
    .insert(schema.casePeople)
    .values({
      caseId: linkedCase.id,
      personId: person.id,
      isPrimary: true,
    })
    .onConflictDoNothing()
}

const [activityResult] = await db
  .select({ value: count() })
  .from(schema.activities)
if (activityResult?.value === 0) {
  const activityValues = cases.flatMap((caseItem, index) => {
    const person = personByExternalId.get(`person-${index + 1}`)
    const organisation = organisationByName.get(caseItem.organisation)
    return [
      {
        caseId: caseItem.id,
        type: index % 2 === 0 ? ('meeting' as const) : ('email' as const),
        body: `Reviewed the current position for ${caseItem.title.toLocaleLowerCase('en')}.`,
        occurredAt: new Date(now - day * (index + 1)),
        createdBy: caseItem.owner,
      },
      ...(person
        ? [
            {
              personId: person.id,
              type: 'note' as const,
              body: `Primary contact for ${caseItem.title.toLocaleLowerCase('en')}.`,
              occurredAt: new Date(now - day * (index + 2)),
              createdBy: 'Mara Chen',
            },
          ]
        : []),
      ...(organisation
        ? [
            {
              organisationId: organisation.id,
              type: 'note' as const,
              body: `Active relationship through ${caseItem.title.toLocaleLowerCase('en')}.`,
              occurredAt: new Date(now - day * (index + 3)),
              createdBy: 'Mara Chen',
            },
          ]
        : []),
    ]
  })

  if (activityValues.length > 0) {
    await db.insert(schema.activities).values(activityValues)
  }
}

const [taskResult] = await db.select({ value: count() }).from(schema.tasks)
if (taskResult?.value === 0) {
  await db.insert(schema.tasks).values(
    cases.map((caseItem, index) => ({
      caseId: caseItem.id,
      title: caseItem.nextAction,
      priority: caseItem.priority,
      assignee: caseItem.owner,
      dueAt: caseItem.nextActionAt,
      status:
        index === cases.length - 1 ? ('completed' as const) : ('open' as const),
      completedAt: index === cases.length - 1 ? new Date(now - day) : null,
    }))
  )
}

await pool.end()
