import type { scoutEvidenceFields } from '@/contracts/values'

type EvidenceField = (typeof scoutEvidenceFields)[number]

/**
 * What an adapter is allowed to do.
 *
 * Policies live in code rather than in a table because they are reviewed the
 * way code is: a change to the hosts an adapter may reach, or to the fields it
 * may keep, should arrive as a diff somebody approved, not as a row somebody
 * edited. The table belongs in the phase where an administrator can change a
 * refresh interval without a deploy; that is not this one.
 */
export interface SourcePolicy {
  id: string
  name: string
  /** Exact hosts this adapter may reach. Anything else is refused. */
  allowedHosts: string[]
  /** The only fields this source may contribute. */
  permittedFields: EvidenceField[]
  /**
   * Personal data this source is known to return. Listing it is the point:
   * an adapter that has not thought about what it drops has not thought about
   * personal data at all.
   */
  personalDataFields: string[]
  /** Smallest gap between two requests, in milliseconds. */
  minRequestIntervalMs: number
  requestTimeoutMs: number
  termsReviewedOn: string
  termsUrl: string
  extractorVersion: string
  /** How long an observation from this source stays live. */
  evidenceTtlDays: number
}

export const githubPolicy: SourcePolicy = {
  id: 'github',
  name: 'GitHub public API',
  allowedHosts: ['api.github.com'],
  permittedFields: [
    'official_site',
    'theme_match',
    'public_repository',
    'recent_release',
    'public_documentation',
    'contribution_path',
  ],
  // An organisation profile carries a contact address and a social handle, and
  // repository metadata carries the login of every contributor. None of it is
  // read into evidence.
  personalDataFields: [
    'email',
    'twitter_username',
    'owner.login where the owner is a person',
    'contributor logins',
  ],
  // Unauthenticated GitHub allows 60 requests an hour per address, so a run
  // spends its budget deliberately rather than as fast as it can.
  minRequestIntervalMs: 400,
  requestTimeoutMs: 8_000,
  termsReviewedOn: '2026-08-15',
  termsUrl:
    'https://docs.github.com/en/site-policy/github-terms/github-terms-of-service',
  extractorVersion: 'github-api-v1',
  evidenceTtlDays: 90,
}

export const wikipediaPolicy: SourcePolicy = {
  id: 'wikipedia',
  name: 'Wikipedia REST summary',
  allowedHosts: ['en.wikipedia.org'],
  permittedFields: ['theme_match', 'official_site', 'governance_model'],
  personalDataFields: ['founder and staff names in article prose'],
  minRequestIntervalMs: 200,
  requestTimeoutMs: 8_000,
  termsReviewedOn: '2026-08-15',
  termsUrl: 'https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use',
  extractorVersion: 'wikipedia-rest-v1',
  evidenceTtlDays: 180,
}

export const duckduckgoPolicy: SourcePolicy = {
  id: 'duckduckgo',
  name: 'DuckDuckGo instant answer',
  allowedHosts: ['api.duckduckgo.com'],
  permittedFields: ['theme_match', 'official_site'],
  personalDataFields: ['names appearing in an abstract'],
  minRequestIntervalMs: 500,
  requestTimeoutMs: 8_000,
  termsReviewedOn: '2026-08-15',
  termsUrl: 'https://duckduckgo.com/terms',
  extractorVersion: 'duckduckgo-ia-v1',
  evidenceTtlDays: 60,
}

export const codebergPolicy: SourcePolicy = {
  id: 'codeberg',
  name: 'Codeberg public API',
  allowedHosts: ['codeberg.org'],
  permittedFields: [
    'official_site',
    'theme_match',
    'public_repository',
    'recent_release',
    'public_documentation',
    'contribution_path',
  ],
  personalDataFields: [
    'owner email',
    'owner location',
    'individual account profile',
  ],
  minRequestIntervalMs: 400,
  requestTimeoutMs: 8_000,
  termsReviewedOn: '2026-08-21',
  termsUrl: 'https://codeberg.org/Codeberg/org/src/branch/main/TermsOfUse.md',
  extractorVersion: 'codeberg-api-v1',
  evidenceTtlDays: 90,
}

export const openCollectivePolicy: SourcePolicy = {
  id: 'open_collective',
  name: 'Open Collective public GraphQL API',
  allowedHosts: ['api.opencollective.com'],
  permittedFields: [
    'official_site',
    'theme_match',
    'recent_release',
    'contribution_path',
  ],
  personalDataFields: [
    'individual accounts',
    'member names',
    'member email addresses',
  ],
  minRequestIntervalMs: 500,
  requestTimeoutMs: 8_000,
  termsReviewedOn: '2026-08-21',
  termsUrl: 'https://opencollective.com/terms',
  extractorVersion: 'open-collective-graphql-v2',
  evidenceTtlDays: 90,
}

export const sourcePolicies = [
  githubPolicy,
  wikipediaPolicy,
  duckduckgoPolicy,
  codebergPolicy,
  openCollectivePolicy,
] as const

/**
 * Values that must never become evidence.
 *
 * The database refuses them too, but a run that discovers a contact address
 * should drop it and carry on rather than fail on a constraint: the constraint
 * is the last line, not the plan.
 */
const CONTACT_SHAPES = [
  /(^|\s)[\w.%+-]+@[\w.-]+\.[a-z]{2,}/i,
  /\+[0-9][0-9 ()-]{6,}/,
  /[0-9]{9,}/,
]

export function carriesPersonalData(value: string): boolean {
  return CONTACT_SHAPES.some((pattern) => pattern.test(value))
}

export function isPermittedField(
  policy: Readonly<SourcePolicy>,
  field: EvidenceField
): boolean {
  return policy.permittedFields.includes(field)
}
