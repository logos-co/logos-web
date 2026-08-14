import type * as schema from './schema'

const DAY = 24 * 60 * 60 * 1000

export type ScoutEvidenceSeed = Omit<
  typeof schema.scoutEvidence.$inferInsert,
  'candidateId'
>

export interface ScoutCandidateSeed {
  displayName: string
  entityType: (typeof schema.scoutCandidates.$inferInsert)['entityType']
  domain: string | null
  summary: string | null
  reviewState?: (typeof schema.scoutCandidates.$inferInsert)['reviewState']
  quarantineReason?: string
  firstSeenDaysAgo: number
  lastObservedDaysAgo: number
  evidence: ScoutEvidenceSeed[]
}

interface EvidenceOptions {
  certainty?: ScoutEvidenceSeed['certainty']
  observedDaysAgo?: number
  expiresInDays?: number | null
}

/**
 * Builds one synthetic observation.
 *
 * Times are relative to the moment the fixture is written so a demo never
 * shows evidence that expired months before anybody opened it.
 */
export function evidence(
  field: ScoutEvidenceSeed['field'],
  value: string,
  sourceUrl: string,
  sourceTitle: string,
  excerpt: string,
  options: Readonly<EvidenceOptions> = {}
): ScoutEvidenceSeed {
  const now = Date.now()
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
    observedAt: new Date(now - observedDaysAgo * DAY),
    expiresAt:
      options.expiresInDays === null
        ? null
        : new Date(now + (options.expiresInDays ?? 120) * DAY),
  }
}

/**
 * The candidates the demo starts with.
 *
 * Every domain ends in `.example`, which cannot be registered: a reviewer who
 * opens one has to find nothing, because a fixture that looked like a real
 * organisation would eventually be treated as one. The set is chosen to
 * exercise each outcome a reviewer must be able to tell apart - ready to
 * decide, thin evidence, disagreeing sources, and a subject that turned out to
 * be a person.
 */
export const seededCandidates: ScoutCandidateSeed[] = [
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
      evidence(
        'ecosystem_relation',
        'Listed as a delivery partner on a public connectivity programme',
        'https://grants.example/programmes/community-connectivity/partners',
        'Community connectivity programme partners',
        'Delivery partners for the current round.',
        { certainty: 'derived', observedDaysAgo: 20 }
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
        'https://specs.example/profiles/implementations',
        'Independent implementation register',
        'Known implementations of Beacon profile 3 and profile 7.',
        { certainty: 'derived', observedDaysAgo: 45 }
      ),
    ],
  },
  {
    displayName: 'Sole Practitioner Consultancy',
    entityType: 'unknown',
    domain: null,
    summary: null,
    reviewState: 'quarantined',
    quarantineReason:
      'The subject resolved to one named individual trading under their own name. Nothing was extracted or stored.',
    firstSeenDaysAgo: 9,
    lastObservedDaysAgo: 9,
    evidence: [],
  },
]

/**
 * What a discovery run can still find.
 *
 * A demo of "look for more" is only convincing if there is more, and only
 * honest if the more is visibly invented. These are drawn in order, so each
 * run returns a different handful and the queue grows the way a real one
 * would - including the ones a reviewer should turn down.
 */
export const discoverableCandidates: ScoutCandidateSeed[] = [
  {
    displayName: 'Tessellate Node Guild',
    entityType: 'community',
    domain: 'tessellate.example',
    summary:
      'Runs shared validator and relay infrastructure for small member operators.',
    firstSeenDaysAgo: 0,
    lastObservedDaysAgo: 0,
    evidence: [
      evidence(
        'official_site',
        'tessellate.example',
        'https://tessellate.example/',
        'Tessellate Node Guild',
        'Shared infrastructure for operators too small to run it alone.'
      ),
      evidence(
        'theme_match',
        'Community-operated infrastructure',
        'https://tessellate.example/charter',
        'Guild charter',
        'Members pool hardware and operating time; nobody holds a controlling share.'
      ),
      evidence(
        'contribution_path',
        'Open membership process with published criteria',
        'https://tessellate.example/join',
        'Join the guild',
        'Applications are reviewed monthly against published criteria.'
      ),
      evidence(
        'recent_release',
        'Operating report dated 2026-06-18',
        'https://tessellate.example/reports',
        'Operating reports',
        'Quarterly report covering uptime and member growth.',
        { certainty: 'derived', observedDaysAgo: 1 }
      ),
    ],
  },
  {
    displayName: 'Umbra Transport Working Group',
    entityType: 'project',
    domain: 'umbra-transport.example',
    summary:
      'Drafts a metadata-resistant transport profile with several implementers.',
    firstSeenDaysAgo: 0,
    lastObservedDaysAgo: 0,
    evidence: [
      evidence(
        'official_site',
        'umbra-transport.example',
        'https://umbra-transport.example/',
        'Umbra Transport Working Group',
        'A transport profile that does not leak who is talking to whom.'
      ),
      evidence(
        'theme_match',
        'Privacy-preserving transport',
        'https://umbra-transport.example/scope',
        'Scope',
        'The profile targets metadata resistance rather than payload secrecy alone.'
      ),
      evidence(
        'public_documentation',
        'Draft profile and test vectors',
        'https://umbra-transport.example/draft',
        'Draft 07',
        'Draft 07 with test vectors and an interoperability matrix.'
      ),
      evidence(
        'ecosystem_relation',
        'Four independent implementations listed',
        'https://umbra-transport.example/implementations',
        'Implementations',
        'Implementation status by participant.',
        { certainty: 'derived' }
      ),
    ],
  },
  {
    displayName: 'Ledgerless Archive',
    entityType: 'project',
    domain: 'ledgerless.example',
    summary:
      'Long-term public archive research. Last published output is two years old.',
    firstSeenDaysAgo: 0,
    lastObservedDaysAgo: 0,
    evidence: [
      evidence(
        'official_site',
        'ledgerless.example',
        'https://ledgerless.example/',
        'Ledgerless Archive',
        'Preserving public records without a permanent operator.'
      ),
      evidence(
        'theme_match',
        'Durable public archives',
        'https://ledgerless.example/mission',
        'Mission',
        'We are building archives that outlive the institutions that fund them.',
        { certainty: 'derived', observedDaysAgo: 400 }
      ),
      evidence(
        'recent_release',
        'Last release dated 2024-05-04',
        'https://ledgerless.example/releases',
        'Releases',
        'Prototype 0.3, unchanged since.',
        { certainty: 'derived', observedDaysAgo: 430 }
      ),
    ],
  },
  {
    displayName: 'Northgate Civic Data Trust',
    entityType: 'organisation',
    domain: 'northgatetrust.example',
    summary:
      'Holds civic datasets on behalf of residents under a published trust deed.',
    firstSeenDaysAgo: 0,
    lastObservedDaysAgo: 0,
    evidence: [
      evidence(
        'official_site',
        'northgatetrust.example',
        'https://northgatetrust.example/',
        'Northgate Civic Data Trust',
        'A trust that holds data on behalf of the people it describes.'
      ),
      evidence(
        'governance_model',
        'Charitable trust with published deed',
        'https://northgatetrust.example/governance',
        'Governance',
        'The trust deed and the trustee register are published in full.'
      ),
      evidence(
        'theme_match',
        'Collective data governance',
        'https://northgatetrust.example/what-we-do',
        'What we do',
        'Residents decide collectively how their data may be used.'
      ),
      evidence(
        'ecosystem_relation',
        'Shares a funder with two infrastructure cooperatives',
        'https://grants.example/awards/northgate',
        'Grant award record',
        'Award listing showing the funding programme and cohort.',
        { certainty: 'derived' }
      ),
    ],
  },
  {
    displayName: 'Palewind Analytics',
    entityType: 'organisation',
    domain: 'palewind.example',
    summary:
      'Commercial audience analytics. Surfaced by a theme keyword, not by fit.',
    firstSeenDaysAgo: 0,
    lastObservedDaysAgo: 0,
    evidence: [
      evidence(
        'official_site',
        'palewind.example',
        'https://palewind.example/',
        'Palewind Analytics',
        'Audience measurement for publishers and brands.'
      ),
      evidence(
        'theme_match',
        'Mentions privacy in marketing copy only',
        'https://palewind.example/privacy-first',
        'Privacy-first analytics',
        'Privacy-first measurement that keeps your reporting intact.',
        { certainty: 'ambiguous' }
      ),
    ],
  },
  {
    displayName: 'Keystone Grid Cooperative',
    entityType: 'organisation',
    domain: 'keystonegrid.example',
    summary:
      'Member-owned energy grid operator publishing its control software.',
    firstSeenDaysAgo: 0,
    lastObservedDaysAgo: 0,
    evidence: [
      evidence(
        'official_site',
        'keystonegrid.example',
        'https://keystonegrid.example/',
        'Keystone Grid Cooperative',
        'A grid owned by the households connected to it.'
      ),
      evidence(
        'governance_model',
        'Registered cooperative',
        'https://keystonegrid.example/members',
        'Membership',
        'One member, one vote, regardless of consumption.'
      ),
      evidence(
        'public_repository',
        'Control software published under a public licence',
        'https://code.keystonegrid.example/controller',
        'keystone/controller',
        'Grid control software, published so members can audit it.'
      ),
      evidence(
        'recent_release',
        'Release 2.9 dated 2026-08-02',
        'https://code.keystonegrid.example/controller/releases',
        'Releases',
        'v2.9 - scheduling fixes for shared battery capacity.',
        { certainty: 'derived', observedDaysAgo: 2 }
      ),
    ],
  },
  {
    displayName: 'Fenwick Media Lab',
    entityType: 'unknown',
    domain: null,
    summary: null,
    reviewState: 'quarantined',
    quarantineReason:
      'The site is one person publishing under a studio name, with their own name on every page. Discarded before extraction.',
    firstSeenDaysAgo: 0,
    lastObservedDaysAgo: 0,
    evidence: [],
  },
  {
    displayName: 'Solenoid Research Circle',
    entityType: 'community',
    domain: 'solenoid.example',
    summary:
      'Reading and prototyping circle for distributed systems. Thin public record.',
    firstSeenDaysAgo: 0,
    lastObservedDaysAgo: 0,
    evidence: [
      evidence(
        'official_site',
        'solenoid.example',
        'https://solenoid.example/',
        'Solenoid Research Circle',
        'We read papers and build small things from them.'
      ),
    ],
  },
  {
    displayName: 'Wayfare Identity Foundation',
    entityType: 'organisation',
    domain: 'wayfareid.example',
    summary:
      'Publishes portable identity specifications. Sources disagree on where it is established.',
    firstSeenDaysAgo: 0,
    lastObservedDaysAgo: 0,
    evidence: [
      evidence(
        'official_site',
        'wayfareid.example',
        'https://wayfareid.example/',
        'Wayfare Identity Foundation',
        'Portable identity that is not owned by the service you signed into.'
      ),
      evidence(
        'theme_match',
        'Self-sovereign identity',
        'https://wayfareid.example/specs',
        'Specifications',
        'Credential formats and the recovery model behind them.'
      ),
      evidence(
        'governance_model',
        'Foundation established in Zug',
        'https://wayfareid.example/about',
        'About',
        'The foundation is established in Zug and governed by a five-seat council.'
      ),
      evidence(
        'governance_model',
        'Foundation established in Tallinn',
        'https://registry.example/wayfare-identity',
        'Public register entry',
        'Registered office recorded in Tallinn.',
        { certainty: 'derived', observedDaysAgo: 1 }
      ),
    ],
  },
]
