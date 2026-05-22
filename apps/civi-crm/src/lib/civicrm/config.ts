/**
 * Instance-specific CiviCRM identifiers.
 *
 * These values are set during CiviCRM installation and may differ between
 * instances. Update this file when deploying to a new environment rather
 * than hunting for scattered constants.
 */
export const civiConfig = {
  /**
   * relationship_type_id for "Case Coordinator is".
   * Used when creating coordinator–contact relationships via the API.
   */
  COORDINATOR_RELATIONSHIP_TYPE_ID: 15,

  /**
   * relationship_type_id:name for "Case Coordinator is".
   * Used in WHERE clauses that filter by the named relationship type.
   */
  COORDINATOR_RELATIONSHIP_TYPE_NAME: 'Case Coordinator is' as const,

  /**
   * activity_type_id for the custom "CMS Activity" type.
   * All activities logged by this application use this type.
   */
  CMS_ACTIVITY_TYPE_ID: 80,

  /**
   * activity status_id for "Completed".
   * Logged activities are marked completed immediately on creation.
   */
  ACTIVITY_STATUS_COMPLETED_ID: 2,

  /**
   * CiviCRM APIv4 prefix used in CaseContact deep-join field paths.
   * Strip this prefix when querying the Contact entity directly.
   */
  CONTACT_ID_PREFIX: 'contact_id.' as const,
} as const
