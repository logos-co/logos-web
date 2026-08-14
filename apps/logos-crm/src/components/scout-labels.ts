import type {
  scoutBands,
  scoutDimensions,
  scoutEntityTypes,
  scoutEvidenceFields,
  scoutGates,
  scoutReviewStates,
} from '@/contracts/values'

type Band = (typeof scoutBands)[number]
type Dimension = (typeof scoutDimensions)[number]
type EntityType = (typeof scoutEntityTypes)[number]
type EvidenceField = (typeof scoutEvidenceFields)[number]
type Gate = (typeof scoutGates)[number]
type ReviewState = (typeof scoutReviewStates)[number]

export const dimensionLabels: Record<Dimension, string> = {
  technical_relevance: 'Technical relevance',
  current_activity: 'Current activity',
  open_collaboration: 'Open collaboration surface',
  ecosystem_adjacency: 'Ecosystem adjacency',
}

export const bandLabels: Record<Band, string> = {
  strong: 'Strong',
  moderate: 'Moderate',
  weak: 'Weak',
  unevidenced: 'No evidence',
}

export const evidenceFieldLabels: Record<EvidenceField, string> = {
  official_site: 'Official site',
  theme_match: 'Stated work',
  public_repository: 'Public repository',
  recent_release: 'Recent release',
  public_documentation: 'Public documentation',
  contribution_path: 'Contribution path',
  ecosystem_relation: 'Ecosystem relation',
  governance_model: 'Governance model',
}

export const entityTypeLabels: Record<EntityType, string> = {
  organisation: 'Organisation',
  project: 'Project',
  community: 'Community',
  unknown: 'Unknown',
}

export const reviewStateLabels: Record<ReviewState, string> = {
  needs_review: 'Needs review',
  accepted: 'Accepted',
  watch: 'Watching',
  rejected: 'Rejected',
  needs_evidence: 'Needs evidence',
  quarantined: 'Quarantined',
}

/**
 * The gate in the reviewer's words. It describes our evidence, never the
 * organisation, so none of these may read as a verdict on the candidate.
 */
export const gateLabels: Record<Gate, string> = {
  sufficient: 'Ready to review',
  insufficient: 'Not enough evidence',
  conflicted: 'Sources disagree',
}

export const decisionLabels = {
  accept: 'Accept',
  watch: 'Watch',
  reject: 'Reject',
  needs_evidence: 'Request evidence',
} as const
