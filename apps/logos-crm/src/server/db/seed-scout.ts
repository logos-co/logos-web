import { eq } from 'drizzle-orm'

import { refreshScoutAssessment } from '@/server/scout-repository'

import { db } from './index'
import * as schema from './schema'

const DAY = 24 * 60 * 60 * 1000
const now = Date.now()

function daysAgo(days: number): Date {
  return new Date(now - days * DAY)
}

function daysAhead(days: number): Date {
  return new Date(now + days * DAY)
}

type EntityType = (typeof schema.scoutCandidates.$inferInsert)['entityType']
type EvidenceSeed = Omit<
  typeof schema.scoutEvidence.$inferInsert,
  'candidateId'
>

interface CandidateSeed {
  displayName: string
  entityType: EntityType
  domain: string | null
  summary: string
  reviewState?: (typeof schema.scoutCandidates.$inferInsert)['reviewState']
  quarantineReason?: string
  firstSeenDaysAgo: number
  lastObservedDaysAgo: number
  evidence: EvidenceSeed[]
}

function evidence(
  field: EvidenceSeed['field'],
  value: string,
  sourceUrl: string,
  sourceTitle: string,
  excerpt: string,
  options: Readonly<{
    certainty?: EvidenceSeed['certainty']
    observedDaysAgo?: number
    expiresInDays?: number | null
  }> = {}
): EvidenceSeed {
  const observedDaysAgo = options.observedDaysAgo ?? 6

  return {
    field,
    value,
    sourceUrl,
    sourceTitle,
    excerpt,
    // A hash of nothing would be a lie about a real fetch, so synthetic
    // evidence says what it is here too.
    contentHash: `synthetic:${field}:${sourceUrl}`,
    extractionMethod: 'synthetic',
    extractorVersion: 'synthetic-fixture-v1',
    certainty: options.certainty ?? 'exact',
    observedAt: daysAgo(observedDaysAgo),
    expiresAt:
      options.expiresInDays === null
        ? null
        : daysAhead(options.expiresInDays ?? 120),
  }
}

/**
 * Synthetic organisations, invented for this fixture.
 *
 * Every domain ends in `.example`, which cannot be registered: a reviewer who
 * opens one has to find nothing, because a fixture that looks like a real
 * organisation would eventually be treated as one. The set is chosen to
 * exercise each outcome a reviewer has to be able to tell apart - ready to
 * decide, thin evidence, disagreeing sources, and a subject that turned out to
 * be a person.
 */
const candidateSeeds: CandidateSeed[] = [
  {
    displayName: 'Halcyon Relay Collective',
    entityType: 'organisation',
    domain: 'halcyonrelay.example',
    summary:
      'Operates volunteer message relays and publishes the routing software they run.',
    firstSeenDaysAgo: 21,
    lastObservedDaysAgo: 2,
    evidence: [
      evidence(
        'official_site',
        'halcyonrelay.example',
        'https://halcyonrelay.example/',
        'Halcyon Relay Collective',
        'We operate relays for censorship-resistant messaging and publish everything we run.'
      ),
      evidence(
        'theme_match',
        'Censorship-resistant messaging',
        'https://halcyonrelay.example/about',
        'About the collective',
        'Our work is metadata-resistant message routing for people in hostile networks.'
      ),
      evidence(
        'public_repository',
        'Public repository, 40 contributors',
        'https://code.halcyonrelay.example/relay',
        'halcyon/relay',
        'Relay node implementation. Contributions are reviewed in the open.'
      ),
      evidence(
        'recent_release',
        'Release 4.2 dated 2026-07-30',
        'https://code.halcyonrelay.example/relay/releases',
        'Releases',
        'v4.2 - transport hardening and a smaller resident memory footprint.',
        { certainty: 'derived', observedDaysAgo: 3 }
      ),
      evidence(
        'contribution_path',
        'Published contribution guide and open grant round',
        'https://halcyonrelay.example/contribute',
        'Contribute',
        'Anyone can propose a relay improvement; the current grant round closes in autumn.'
      ),
      evidence(
        'ecosystem_relation',
        'Co-authors an open routing specification with two other implementers',
        'https://specs.example/routing/participants',
        'Routing specification participants',
        'Implementers listed as co-authors of the current draft.',
        { certainty: 'derived' }
      ),
    ],
  },
  {
    displayName: 'Meshwork Commons',
    entityType: 'community',
    domain: 'meshwork.example',
    summary:
      'Neighbourhood mesh networks run by the people who use them, with published build guides.',
    firstSeenDaysAgo: 34,
    lastObservedDaysAgo: 5,
    evidence: [
      evidence(
        'official_site',
        'meshwork.example',
        'https://meshwork.example/',
        'Meshwork Commons',
        'Community-run networks. Build guides, meeting notes, and a shared parts list.'
      ),
      evidence(
        'theme_match',
        'Community-operated infrastructure',
        'https://meshwork.example/handbook',
        'Handbook',
        'Every node is owned by the household that runs it, not by us.',
        { certainty: 'derived' }
      ),
      evidence(
        'public_documentation',
        'Published build and governance handbook',
        'https://meshwork.example/handbook',
        'Handbook',
        'How to add a node, how decisions are made, and how disputes are resolved.'
      ),
      evidence(
        'recent_release',
        'Handbook revision dated 2025-11-02',
        'https://meshwork.example/handbook/changelog',
        'Handbook changelog',
        'Revision covering the new antenna guidance.',
        { certainty: 'derived', observedDaysAgo: 240 }
      ),
    ],
  },
  {
    displayName: 'Quorum Field',
    entityType: 'organisation',
    domain: 'quorumfield.example',
    summary:
      'Builds decision-making tools for member-owned organisations. Sources disagree on its legal form.',
    firstSeenDaysAgo: 12,
    lastObservedDaysAgo: 1,
    evidence: [
      evidence(
        'official_site',
        'quorumfield.example',
        'https://quorumfield.example/',
        'Quorum Field',
        'Tools for groups that make decisions together.'
      ),
      evidence(
        'theme_match',
        'Governance tooling for member-owned organisations',
        'https://quorumfield.example/product',
        'What we build',
        'Proposal, deliberation, and recorded-decision tooling for cooperatives.'
      ),
      evidence(
        'governance_model',
        'Registered cooperative',
        'https://quorumfield.example/about',
        'About',
        'Quorum Field is a registered cooperative owned by its members.'
      ),
      // The disagreement is the point: two live sources, two answers, and the
      // rubric refuses to pick the more flattering one.
      evidence(
        'governance_model',
        'Private company limited by shares',
        'https://registry.example/quorum-field',
        'Public register entry',
        'Company type: private company limited by shares.',
        { certainty: 'derived', observedDaysAgo: 2 }
      ),
    ],
  },
  {
    displayName: 'Vault Lattice',
    entityType: 'project',
    domain: 'vaultlattice.example',
    summary:
      'Erasure-coded storage research. Only its own site says anything about it.',
    firstSeenDaysAgo: 4,
    lastObservedDaysAgo: 4,
    evidence: [
      evidence(
        'official_site',
        'vaultlattice.example',
        'https://vaultlattice.example/',
        'Vault Lattice',
        'Durable storage without a custodian. Research notes and a prototype.'
      ),
      evidence(
        'theme_match',
        'Decentralised storage',
        'https://vaultlattice.example/',
        'Vault Lattice',
        'We are working on erasure-coded storage that survives operator loss.',
        { certainty: 'ambiguous' }
      ),
    ],
  },
  {
    displayName: 'Beacon Standards Group',
    entityType: 'organisation',
    domain: 'beaconstandards.example',
    summary:
      'Publishes interoperability profiles. Watched: relevant, but no current work in our themes.',
    reviewState: 'watch',
    firstSeenDaysAgo: 60,
    lastObservedDaysAgo: 30,
    evidence: [
      evidence(
        'official_site',
        'beaconstandards.example',
        'https://beaconstandards.example/',
        'Beacon Standards Group',
        'Interoperability profiles for transport and identity layers.'
      ),
      evidence(
        'public_documentation',
        'Published specification index',
        'https://beaconstandards.example/specs',
        'Specifications',
        'Current and superseded profiles, with their editors and status.'
      ),
      evidence(
        'ecosystem_relation',
        'Two of its profiles are implemented by relay operators',
        'https://beaconstandards.example/implementations',
        'Implementations',
        'Known implementations of profile 3 and profile 7.',
        { certainty: 'derived', observedDaysAgo: 45 }
      ),
    ],
  },
  {
    displayName: 'Sole Practitioner Consultancy',
    entityType: 'unknown',
    domain: null,
    summary: null as unknown as string,
    reviewState: 'quarantined',
    quarantineReason:
      'The subject resolved to one named individual trading under their own name. Nothing was extracted or stored.',
    firstSeenDaysAgo: 9,
    lastObservedDaysAgo: 9,
    evidence: [],
  },
]

/**
 * Seeds the Scout review queue.
 *
 * Idempotent like the rest of the demo seed: candidates are keyed by their
 * normalised name, and evidence is written only for a candidate that has none.
 */
export async function seedScout(): Promise<void> {
  for (const seed of candidateSeeds) {
    const normalisedName = seed.displayName.toLocaleLowerCase('en')

    await db
      .insert(schema.scoutCandidates)
      .values({
        displayName: seed.displayName,
        normalisedName,
        entityType: seed.entityType,
        domain: seed.domain,
        summary: seed.summary ?? null,
        reviewState: seed.reviewState ?? 'needs_review',
        quarantineReason: seed.quarantineReason ?? null,
        firstSeenAt: daysAgo(seed.firstSeenDaysAgo),
        lastObservedAt: daysAgo(seed.lastObservedDaysAgo),
      })
      .onConflictDoNothing()

    const [candidate] = await db
      .select()
      .from(schema.scoutCandidates)
      .where(eq(schema.scoutCandidates.normalisedName, normalisedName))
      .limit(1)

    if (!candidate) continue

    const existing = await db
      .select({ id: schema.scoutEvidence.id })
      .from(schema.scoutEvidence)
      .where(eq(schema.scoutEvidence.candidateId, candidate.id))
      .limit(1)

    if (existing.length === 0 && seed.evidence.length > 0) {
      await db
        .insert(schema.scoutEvidence)
        .values(
          seed.evidence.map((item) => ({ ...item, candidateId: candidate.id }))
        )
    }

    // A quarantined candidate is never assessed: assessing it would mean
    // reading evidence that deliberately does not exist.
    if (candidate.reviewState !== 'quarantined') {
      await refreshScoutAssessment(candidate.id)
    }
  }
}
