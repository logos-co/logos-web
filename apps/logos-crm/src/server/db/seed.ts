import { db, pool } from './index'
import * as schema from './schema'
import { seedScout } from './seed-scout'

const day = 24 * 60 * 60 * 1000
const now = Date.now()

/**
 * The seeded users are what the actor seam resolves against while the app runs
 * without authentication: `CRM_DEV_ACTOR_EMAIL` must match one of these.
 *
 * The names are invented. Everything here is served on a demo instance with no
 * sign-in, so a real colleague's name and address would be personal data
 * published to anyone with the URL - the same thing the privacy rules in this
 * app exist to prevent. The team names are the real ones because a team is not
 * a person.
 */
const userSeeds = [
  ['Mara Chen', 'mara.chen@logos.co', 'Ecodev'],
  ['Jon Bell', 'jon.bell@logos.co', 'Movement'],
  ['Niko Reyes', 'niko.reyes@logos.co', 'Ecodev'],
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

/**
 * Both are seeded so the demo shows cross-team work, which a single-team
 * fixture cannot produce.
 *
 * The Notion export carries two more business units - nimbus and IR - and a
 * record there can belong to several at once. They are left out because no
 * stakeholder for them has been interviewed yet, not because they do not
 * exist. The `stage` values below are the real Notion ones, and Ecodev and
 * Movement do not share a vocabulary: each team runs its own pipeline on its
 * own column. See docs/open-questions.md#9.
 */
const teamSeeds = ['Ecodev', 'Movement'] as const

await db
  .insert(schema.teams)
  .values(
    teamSeeds.map((name) => ({
      name,
      normalisedName: name.toLocaleLowerCase('en'),
    }))
  )
  .onConflictDoNothing()

const teamRows = await db.select().from(schema.teams)
const teamByName = new Map(teamRows.map((row) => [row.name, row]))

const userTeamValues = userSeeds.flatMap(([displayName, , teamName]) => {
  const user = userByName.get(displayName)
  const team = teamByName.get(teamName)
  return user && team ? [{ userId: user.id, teamId: team.id }] : []
})
if (userTeamValues.length > 0) {
  await db.insert(schema.userTeams).values(userTeamValues).onConflictDoNothing()
}

/**
 * Counterparties, not Logos itself. The organisations are invented and use
 * `.example` domains, which is reserved and can never resolve: a demo instance
 * that carries a real organisation's name and address implies a relationship
 * nobody agreed to, and a plausible-looking domain invites somebody to mail it.
 * The Logos side of the relationship is carried by the cases below, which name
 * the real programmes these leads would be talking to.
 */
const organisationSeeds = [
  [
    'Cypherpunk Guild Berlin',
    'cypherpunkguild.example',
    'Privacy meetup running monthly workshops on censorship-resistant messaging.',
  ],
  [
    'Meshnet Node Collective',
    'meshnetnodes.example',
    'Community node operators hosting relays and testnet infrastructure.',
  ],
  [
    'Parallel Society Institute',
    'parallelsociety.example',
    'Research group publishing on network states and self-sovereign governance.',
  ],
  [
    'Freedom Stack Foundation',
    'freedomstack.example',
    'Grant funder for public-interest censorship-resistant infrastructure.',
  ],
  [
    'Sovereign Campus Network',
    'sovereigncampus.example',
    'University cypherpunk societies running student build programmes.',
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
    'Nadia Brandt',
    'Community lead',
    'Cypherpunk Guild Berlin',
    'nadia@cypherpunkguild.example',
  ],
  [
    'Emil Vasquez',
    'Node operations lead',
    'Meshnet Node Collective',
    'emil@meshnetnodes.example',
  ],
  [
    'Hana Ito',
    'Research fellow',
    'Parallel Society Institute',
    'hana@parallelsociety.example',
  ],
  [
    'Omar Diallo',
    'Grants director',
    'Freedom Stack Foundation',
    'omar@freedomstack.example',
  ],
  [
    'Petra Nowak',
    'Programme organiser',
    'Sovereign Campus Network',
    'petra@sovereigncampus.example',
  ],
  [
    'Kofi Mensah',
    'Independent protocol researcher',
    'Independent',
    'kofi@example.org',
  ],
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
 * Source identifiers live in their own table so one record can carry several -
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
 *
 * `profile` and `leadSource` are set on the Movement cases only. They are
 * answers to public funnel questions, and in the Notion export all 124 rows
 * carrying a Profile are Movement - so putting one on an Ecodev case would
 * claim the lead arrived through a form it never saw, and inflate every funnel
 * breakdown built on the field.
 */
const caseSeeds = [
  {
    title: 'Waku integration for guild messaging',
    organisationName: 'Cypherpunk Guild Berlin',
    ownerName: 'Mara Chen',
    teamName: 'Ecodev',
    pipeline: 'ecodev' as const,
    status: 'in_progress' as const,
    stage: 'solution_eng',
    priority: 'high' as const,
    profile: null,
    leadSource: null,
    summary:
      'Guild wants to move its announcement channel off a centralised platform onto Waku.',
    note: 'Walked through the Waku relay setup and what the guild would have to self-host.',
    nextAction: 'Confirm technical discovery session',
    nextActionAt: new Date(now + day),
    lastContactAt: new Date(now - day),
  },
  {
    title: 'Nomos testnet node cohort',
    organisationName: 'Meshnet Node Collective',
    ownerName: 'Niko Reyes',
    teamName: 'Ecodev',
    pipeline: 'ecodev' as const,
    status: 'waiting' as const,
    stage: 'qualified',
    priority: 'medium' as const,
    profile: null,
    leadSource: null,
    summary:
      'Collective can bring roughly forty operators into the next Nomos testnet round.',
    note: 'Sent the operator requirements; waiting on their hardware inventory.',
    nextAction: 'Review hosting requirements',
    nextActionAt: new Date(now + day * 3),
    lastContactAt: new Date(now - day * 4),
  },
  {
    title: 'Network state research collaboration',
    organisationName: 'Parallel Society Institute',
    ownerName: null,
    teamName: 'Ecodev',
    pipeline: 'ecodev' as const,
    status: 'new' as const,
    stage: 'lead',
    priority: 'high' as const,
    profile: null,
    leadSource: null,
    summary:
      'Institute asked about a joint publication. Nobody has picked it up yet.',
    note: 'Inbound email to the ecodev alias. No coordinator assigned.',
    nextAction: null,
    nextActionAt: null,
    lastContactAt: null,
  },
  {
    title: 'Codex storage pilot for public archives',
    organisationName: 'Freedom Stack Foundation',
    ownerName: 'Mara Chen',
    teamName: 'Ecodev',
    pipeline: 'ecodev' as const,
    status: 'resolved' as const,
    stage: 'confirmed',
    priority: 'low' as const,
    profile: null,
    leadSource: null,
    summary:
      'Foundation is funding a durable archive and wants Codex as the storage layer.',
    note: 'Approved for the pilot. Scope and archive size agreed on the last call.',
    nextAction: 'Archive final programme notes',
    nextActionAt: new Date(now + day * 7),
    lastContactAt: new Date(now - day * 2),
  },
  {
    title: 'Logos Circles campus chapter',
    organisationName: 'Sovereign Campus Network',
    ownerName: 'Jon Bell',
    teamName: 'Movement',
    pipeline: 'movement' as const,
    status: 'in_progress' as const,
    stage: 'training_call',
    priority: 'medium' as const,
    profile: 'Activist Leader / Steward',
    leadSource: 'Social media',
    summary:
      'Three student societies want to run Logos Circles chapters next term.',
    note: 'Discussed what a chapter commits to and who would steward each society.',
    nextAction: 'Share integration brief',
    nextActionAt: new Date(now + day * 2),
    lastContactAt: new Date(now - day * 3),
  },
  {
    title: 'Logos Press Engine contributor outreach',
    organisationName: 'Independent',
    ownerName: 'Jon Bell',
    teamName: 'Movement',
    pipeline: 'movement' as const,
    status: 'closed' as const,
    stage: 'redirected_post_call',
    priority: 'low' as const,
    profile: 'Activist Builder',
    leadSource: 'Podcast',
    summary:
      'Researcher pitched a written series. Redirected to the editorial contributor path.',
    note: 'Closed and redirected: this is an editorial submission, not a partnership.',
    nextAction: null,
    nextActionAt: null,
    lastContactAt: new Date(now - day * 14),
  },
]

/**
 * Seeded per title rather than behind a "the table is empty" guard. A global
 * count check silently does nothing on a partly-populated database - which is
 * exactly the state the integration tests leave behind - and the developer is
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
          teamId: teamByName.get(seed.teamName)?.id ?? null,
          status: seed.status,
          pipeline: seed.pipeline,
          stage: seed.stage,
          priority: seed.priority,
          profile: seed.profile,
          leadSource: seed.leadSource,
          summary: seed.summary,
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
              body: seed.note,
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
              body: `Primary contact for ${seed.title}.`,
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
              body: `Active relationship through ${seed.title}.`,
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

await seedScout()

await pool.end()
