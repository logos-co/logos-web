import { db, pool } from './index'
import * as schema from './schema'

const day = 24 * 60 * 60 * 1000
const now = Date.now()

/**
 * The seeded users are what the actor seam resolves against while the app runs
 * without authentication: `CRM_DEV_ACTOR_EMAIL` must match one of these.
 */
const userSeeds = [
  ['Mara Chen', 'mara.chen@logos.co'],
  ['Jon Bell', 'jon.bell@logos.co'],
  ['Niko Reyes', 'niko.reyes@logos.co'],
] as const

await db
  .insert(schema.users)
  .values(
    userSeeds.map(([displayName, email]) => ({
      displayName,
      email,
      normalisedEmail: email.toLocaleLowerCase('en'),
      status: 'active' as const,
    }))
  )
  .onConflictDoNothing()

const userRows = await db.select().from(schema.users)
const userByName = new Map(userRows.map((row) => [row.displayName, row]))

await db
  .insert(schema.teams)
  .values({ name: 'Movement', normalisedName: 'movement' })
  .onConflictDoNothing()

const [movementTeam] = await db.select().from(schema.teams).limit(1)

const userTeamValues = userRows.flatMap((user) =>
  movementTeam ? [{ userId: user.id, teamId: movementTeam.id }] : []
)
if (userTeamValues.length > 0) {
  await db.insert(schema.userTeams).values(userTeamValues).onConflictDoNothing()
}

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
    personSeeds.map(([fullName, roleTitle, organisationName], index) => ({
      fullName,
      roleTitle,
      status: index < 4 ? ('active' as const) : ('prospect' as const),
      summary: `Primary coordination contact for ${organisationName}.`,
    }))
  )
  .onConflictDoNothing()

const personRows = await db.select().from(schema.people)
const personByName = new Map(personRows.map((row) => [row.fullName, row]))

/**
 * Source identifiers live in their own table so one record can carry several —
 * the same person arriving from the CiviCRM dump and again from the Notion
 * bridge keeps both IDs.
 */
const externalIdentityValues = [
  ...organisationSeeds.flatMap(([displayName], index) => {
    const organisation = organisationByName.get(displayName)
    return organisation
      ? [
          {
            sourceSystem: 'demo',
            entityType: 'organisation',
            entityId: organisation.id,
            sourceId: `organisation-${index + 1}`,
          },
        ]
      : []
  }),
  ...personSeeds.flatMap(([fullName], index) => {
    const person = personByName.get(fullName)
    return person
      ? [
          {
            sourceSystem: 'demo',
            entityType: 'person',
            entityId: person.id,
            sourceId: `person-${index + 1}`,
          },
        ]
      : []
  }),
]
if (externalIdentityValues.length > 0) {
  await db
    .insert(schema.externalIdentities)
    .values(externalIdentityValues)
    .onConflictDoNothing()
}

const existingMethods = await db.select().from(schema.contactMethods)
const existingMethodKeys = new Set(
  existingMethods.map(
    (row) => `${row.personId}:${row.type}:${row.normalisedValue}`
  )
)
const contactValues = personSeeds.flatMap(([fullName, , , email]) => {
  const person = personByName.get(fullName)
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
  ([fullName, roleTitle, organisationName]) => {
    const person = personByName.get(fullName)
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

/**
 * The third case is deliberately unassigned with no next action: unassigned and
 * untriaged is a real intake state, and the queues have to be built against it
 * rather than against a placeholder.
 */
const caseSeeds = [
  {
    title: 'Protocol research partnership',
    organisationName: 'Open Systems Lab',
    ownerName: 'Mara Chen',
    status: 'in_progress' as const,
    stage: 'Qualification',
    priority: 'high' as const,
    nextAction: 'Confirm technical discovery session',
    nextActionAt: new Date(now + day),
    lastContactAt: new Date(now - day),
  },
  {
    title: 'Community node programme',
    organisationName: 'Nodecraft Collective',
    ownerName: 'Jon Bell',
    status: 'waiting' as const,
    stage: 'Proposal',
    priority: 'medium' as const,
    nextAction: 'Review hosting requirements',
    nextActionAt: new Date(now + day * 3),
    lastContactAt: new Date(now - day * 4),
  },
  {
    title: 'Privacy tooling collaboration',
    organisationName: 'Cipher Commons',
    ownerName: null,
    status: 'new' as const,
    stage: 'Intake',
    priority: 'high' as const,
    nextAction: null,
    nextActionAt: null,
    lastContactAt: null,
  },
  {
    title: 'Developer education series',
    organisationName: 'Assembly School',
    ownerName: 'Niko Reyes',
    status: 'resolved' as const,
    stage: 'Approved',
    priority: 'low' as const,
    nextAction: 'Archive final programme notes',
    nextActionAt: new Date(now + day * 7),
    lastContactAt: new Date(now - day * 2),
  },
  {
    title: 'Local-first tooling pilot',
    organisationName: 'Moss Studio',
    ownerName: 'Jon Bell',
    status: 'in_progress' as const,
    stage: 'Discovery',
    priority: 'medium' as const,
    nextAction: 'Share integration brief',
    nextActionAt: new Date(now + day * 2),
    lastContactAt: new Date(now - day * 3),
  },
  {
    title: 'Research grants intake',
    organisationName: 'Independent',
    ownerName: 'Niko Reyes',
    status: 'closed' as const,
    stage: 'Redirected',
    priority: 'low' as const,
    nextAction: null,
    nextActionAt: null,
    lastContactAt: new Date(now - day * 14),
  },
]

/**
 * Seeded per title rather than behind a "the table is empty" guard. A global
 * count check silently does nothing on a partly-populated database — which is
 * exactly the state the integration tests leave behind — and the developer is
 * left wondering where the demo data went.
 */
const existingCaseTitles = new Set(
  (await db.select({ title: schema.cases.title }).from(schema.cases)).map(
    (row) => row.title
  )
)

{
  for (const seed of caseSeeds) {
    if (existingCaseTitles.has(seed.title)) continue
    const owner = seed.ownerName ? userByName.get(seed.ownerName) : undefined
    const organisation = organisationByName.get(seed.organisationName)
    const person = personSeeds.find(
      ([, , organisationName]) => organisationName === seed.organisationName
    )
    const personRow = person ? personByName.get(person[0]) : undefined

    await db.transaction(async (transaction) => {
      const [row] = await transaction
        .insert(schema.cases)
        .values({
          title: seed.title,
          ownerUserId: owner?.id ?? null,
          teamId: movementTeam?.id ?? null,
          status: seed.status,
          stage: seed.stage,
          priority: seed.priority,
          nextAction: seed.nextAction,
          nextActionAt: seed.nextActionAt,
          lastContactAt: seed.lastContactAt,
        })
        .returning()

      if (!row) return

      await transaction.insert(schema.caseAssignments).values({
        caseId: row.id,
        ownerUserId: row.ownerUserId,
        teamId: row.teamId,
        validFrom: row.createdAt,
      })

      await transaction.insert(schema.caseWorkflowHistory).values({
        caseId: row.id,
        fromStatus: null,
        toStatus: row.status,
        toStage: row.stage,
        effectiveAt: row.createdAt,
        source: 'system',
      })

      if (organisation) {
        await transaction.insert(schema.caseOrganisations).values({
          caseId: row.id,
          organisationId: organisation.id,
          isPrimary: true,
        })
      }

      if (personRow) {
        await transaction.insert(schema.casePeople).values({
          caseId: row.id,
          personId: personRow.id,
          isPrimary: true,
        })
      }
    })
  }
}

const caseRows = await db.select().from(schema.cases)
const caseByTitle = new Map(caseRows.map((row) => [row.title, row]))
const defaultAuthor = userByName.get('Mara Chen')

const casesWithActivity = new Set(
  (
    await db
      .select({ caseId: schema.activities.caseId })
      .from(schema.activities)
  )
    .map((row) => row.caseId)
    .filter((id): id is string => id !== null)
)

if (defaultAuthor) {
  const activityValues = caseSeeds.flatMap((seed, index) => {
    const caseRow = caseByTitle.get(seed.title)
    if (caseRow && casesWithActivity.has(caseRow.id)) return []
    const organisation = organisationByName.get(seed.organisationName)
    const person = personSeeds.find(
      ([, , organisationName]) => organisationName === seed.organisationName
    )
    const personRow = person ? personByName.get(person[0]) : undefined
    const author = seed.ownerName
      ? (userByName.get(seed.ownerName) ?? defaultAuthor)
      : defaultAuthor

    return [
      ...(caseRow
        ? [
            {
              caseId: caseRow.id,
              type: index % 2 === 0 ? ('meeting' as const) : ('email' as const),
              body: `Reviewed the current position for ${seed.title.toLocaleLowerCase('en')}.`,
              occurredAt: new Date(now - day * (index + 1)),
              createdByUserId: author.id,
            },
          ]
        : []),
      ...(personRow
        ? [
            {
              personId: personRow.id,
              type: 'note' as const,
              body: `Primary contact for ${seed.title.toLocaleLowerCase('en')}.`,
              occurredAt: new Date(now - day * (index + 2)),
              createdByUserId: defaultAuthor.id,
            },
          ]
        : []),
      ...(organisation
        ? [
            {
              organisationId: organisation.id,
              type: 'note' as const,
              body: `Active relationship through ${seed.title.toLocaleLowerCase('en')}.`,
              occurredAt: new Date(now - day * (index + 3)),
              createdByUserId: defaultAuthor.id,
            },
          ]
        : []),
    ]
  })

  if (activityValues.length > 0) {
    await db.insert(schema.activities).values(activityValues)
  }
}

const casesWithTask = new Set(
  (await db.select({ caseId: schema.tasks.caseId }).from(schema.tasks))
    .map((row) => row.caseId)
    .filter((id): id is string => id !== null)
)

{
  const taskValues = caseSeeds.flatMap((seed, index) => {
    const caseRow = caseByTitle.get(seed.title)
    if (!caseRow || casesWithTask.has(caseRow.id)) return []
    const owner = seed.ownerName ? userByName.get(seed.ownerName) : undefined

    return [
      {
        caseId: caseRow.id,
        // An untriaged case still gets a task: triage itself is the work.
        title: seed.nextAction ?? 'Review intake',
        priority: seed.priority,
        assigneeUserId: owner?.id ?? null,
        dueAt: seed.nextActionAt ?? new Date(now + day),
        status:
          index === caseSeeds.length - 1
            ? ('completed' as const)
            : ('open' as const),
        completedAt:
          index === caseSeeds.length - 1 ? new Date(now - day) : null,
      },
    ]
  })

  if (taskValues.length > 0) {
    await db.insert(schema.tasks).values(taskValues)
  }
}

await pool.end()
