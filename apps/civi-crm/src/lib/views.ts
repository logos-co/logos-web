// The update target tells the write fan-out which CiviCRM entity to PATCH.
// 'Email' targets the /Email entity (native joined field requiring its own API call).
export type UpdateTarget =
  | { entity: 'Case' }
  | { entity: 'Contact' }
  | { entity: 'Email' }
  // Coordinator assignment is managed through CiviCRM Relationship entities,
  // not via a direct field PATCH on Case or Contact.
  | { entity: 'Relationship' }

export type InputType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'score' // integer 1–5, contributes to scorecard
  | 'readonly'

export type FieldDef = {
  key: string
  // CiviCRM APIv4 field paths.
  // civiLabelPath / civiNamePath are required for option-list fields (:label for display, :name for writes).
  civiPath: string
  civiLabelPath?: string
  civiNamePath?: string
  label: string
  inputType: InputType
  updateTarget: UpdateTarget
  isScorecard?: true
  // When true, civiPath must NOT be added to the Case select[] array.
  // Use for fields backed by a separate query (e.g. Relationship-fetched coordinator name).
  skipSelect?: true
}

export type ListColumnDef = {
  fieldKey: string
  sortable?: boolean
  width?: string
}

export type DetailSectionDef = {
  title: string
  fields: string[] // FieldDef.key references, in display order
}

export type ViewConfig = {
  id: string
  label: string
  // CiviCRM case_type_id:name value used as the primary filter on all /Case queries.
  caseTypeName: string
  // Single registry for both list columns and detail sections.
  fields: FieldDef[]
  listColumns: ListColumnDef[]
  detailSections: {
    case: DetailSectionDef[]
    contact: DetailSectionDef[]
  }
  // Exactly the six FieldDef.key values feeding the scorecard average (Circle_Case.Scorecard).
  scorecardFieldKeys: string[]
}

// ---------------------------------------------------------------------------
// movement_view
// ---------------------------------------------------------------------------

const movementView: ViewConfig = {
  id: 'movement_view',
  label: 'Movement View',
  caseTypeName: 'movement_view',

  scorecardFieldKeys: [
    'missionValuesAlignment',
    'commitmentReliability',
    'facilitationDistributedLeadership',
    'executionAbility',
    'relevantSkillsExperience',
    'overallFit',
  ],

  fields: [
    {
      key: 'subject',
      civiPath: 'subject',
      label: 'Subject',
      inputType: 'text',
      updateTarget: { entity: 'Case' },
    },
    {
      key: 'status',
      civiPath: 'status_id',
      civiLabelPath: 'status_id:label',
      civiNamePath: 'status_id:name',
      label: 'Status',
      inputType: 'select',
      updateTarget: { entity: 'Case' },
    },
    {
      key: 'leadSource',
      civiPath: 'Circle_Case.Lead_Source',
      civiLabelPath: 'Circle_Case.Lead_Source:label',
      civiNamePath: 'Circle_Case.Lead_Source:name',
      label: 'Lead Source',
      inputType: 'select',
      updateTarget: { entity: 'Case' },
    },
    {
      key: 'profile',
      civiPath: 'Circle_Case.Profile',
      civiLabelPath: 'Circle_Case.Profile:label',
      civiNamePath: 'Circle_Case.Profile:name',
      label: 'Profile',
      inputType: 'select',
      updateTarget: { entity: 'Case' },
    },
    {
      key: 'notes',
      civiPath: 'Circle_Case.Notes',
      label: 'Notes',
      inputType: 'textarea',
      updateTarget: { entity: 'Case' },
    },
    // Scorecard scoring fields
    {
      key: 'missionValuesAlignment',
      civiPath: 'Circle_Case.Mission_Values_Alignment',
      label: 'Mission & Values Alignment',
      inputType: 'score',
      updateTarget: { entity: 'Case' },
      isScorecard: true,
    },
    {
      key: 'commitmentReliability',
      civiPath: 'Circle_Case.Commitment_Reliability',
      label: 'Commitment & Reliability',
      inputType: 'score',
      updateTarget: { entity: 'Case' },
      isScorecard: true,
    },
    {
      key: 'facilitationDistributedLeadership',
      civiPath: 'Circle_Case.Facilitation_Distributed_Leadership',
      label: 'Facilitation & Distributed Leadership',
      inputType: 'score',
      updateTarget: { entity: 'Case' },
      isScorecard: true,
    },
    {
      key: 'executionAbility',
      civiPath: 'Circle_Case.Execution_Ability',
      label: 'Execution Ability',
      inputType: 'score',
      updateTarget: { entity: 'Case' },
      isScorecard: true,
    },
    {
      key: 'relevantSkillsExperience',
      civiPath: 'Circle_Case.Relevant_Skills_Experience',
      label: 'Relevant Skills / Experience',
      inputType: 'score',
      updateTarget: { entity: 'Case' },
      isScorecard: true,
    },
    {
      key: 'overallFit',
      civiPath: 'Circle_Case.Overall_Fit',
      label: 'Overall Fit',
      inputType: 'score',
      updateTarget: { entity: 'Case' },
      isScorecard: true,
    },
    // Computed — read-only in the UI
    {
      key: 'scorecard',
      civiPath: 'Circle_Case.Scorecard',
      label: 'Scorecard',
      inputType: 'readonly',
      updateTarget: { entity: 'Case' },
    },
    {
      // Fetched via a separate Relationship query (getCoordinatorByCaseId).
      // skipSelect: true prevents civiPath from being added to the Case select[] array;
      // the list renderer injects the pre-fetched coordinator name for this key instead.
      key: 'assignedTo',
      civiPath: 'coordinator.display_name',
      label: 'Assigned To',
      inputType: 'readonly',
      updateTarget: { entity: 'Relationship' },
      skipSelect: true,
    },
    // Contact fields
    {
      key: 'emailPrimary',
      civiPath: 'contact_id.email_primary',
      label: 'Email',
      inputType: 'text',
      updateTarget: { entity: 'Email' },
    },
    {
      key: 'city',
      civiPath: 'contact_id.address_primary.city',
      label: 'City',
      inputType: 'text',
      updateTarget: { entity: 'Contact' },
    },
    {
      key: 'country',
      civiPath: 'contact_id.address_primary.country_id',
      civiLabelPath: 'contact_id.address_primary.country_id:label',
      civiNamePath: 'contact_id.address_primary.country_id:name',
      label: 'Country',
      inputType: 'select',
      updateTarget: { entity: 'Contact' },
    },
    {
      key: 'skillsExperience',
      civiPath: 'contact_id.Skills_Socials.Skills_Experience',
      civiLabelPath: 'contact_id.Skills_Socials.Skills_Experience:label',
      civiNamePath: 'contact_id.Skills_Socials.Skills_Experience:name',
      label: 'Skills / Experience',
      inputType: 'multiselect',
      updateTarget: { entity: 'Contact' },
    },
    {
      key: 'informedAboutEvents',
      civiPath: 'contact_id.Skills_Socials.Informed_About_Events',
      label: 'Informed about events in my city',
      inputType: 'boolean',
      updateTarget: { entity: 'Contact' },
    },
    {
      key: 'subscribedToNewsletter',
      civiPath: 'contact_id.Skills_Socials.Subscribed_To_Newsletter',
      label: 'Subscribed to Logos Newsletter',
      inputType: 'boolean',
      updateTarget: { entity: 'Contact' },
    },
  ],

  listColumns: [
    { fieldKey: 'subject', sortable: true },
    { fieldKey: 'status', sortable: true },
    { fieldKey: 'leadSource', sortable: true },
    { fieldKey: 'profile', sortable: true },
    { fieldKey: 'scorecard', sortable: true, width: 'w-24' },
    { fieldKey: 'assignedTo', sortable: false },
  ],

  detailSections: {
    case: [
      { title: 'Case', fields: ['status', 'leadSource', 'profile', 'notes'] },
      {
        title: 'Scorecard',
        fields: [
          'missionValuesAlignment',
          'commitmentReliability',
          'facilitationDistributedLeadership',
          'executionAbility',
          'relevantSkillsExperience',
          'overallFit',
        ],
      },
    ],
    contact: [
      {
        title: 'Contact',
        fields: ['emailPrimary', 'city', 'country'],
      },
      {
        title: 'Skills & Experience',
        fields: ['skillsExperience'],
      },
      {
        title: 'Preferences',
        fields: ['informedAboutEvents', 'subscribedToNewsletter'],
      },
    ],
  },
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const VIEW_REGISTRY: Record<string, ViewConfig> = {
  movement_view: movementView,
}

function assertViewIntegrity(view: ViewConfig): void {
  const fieldKeys = new Set(view.fields.map((f) => f.key))
  for (const key of view.scorecardFieldKeys) {
    if (!fieldKeys.has(key))
      throw new Error(
        `View "${view.id}": scorecardFieldKeys references unknown field key "${key}"`
      )
    const field = view.fields.find((f) => f.key === key)!
    if (!field.isScorecard)
      throw new Error(
        `View "${view.id}": scorecardFieldKeys references field "${key}" but it is missing isScorecard: true`
      )
  }
}

export function getActiveView(): ViewConfig {
  const id = process.env.ACTIVE_VIEW ?? 'movement_view'
  const view = VIEW_REGISTRY[id]
  if (!view)
    throw new Error(
      `Unknown ACTIVE_VIEW: "${id}". Available: ${Object.keys(VIEW_REGISTRY).join(', ')}`
    )
  assertViewIntegrity(view)
  return view
}

export function getFieldDef(view: ViewConfig, key: string): FieldDef {
  const field = view.fields.find((f) => f.key === key)
  if (!field)
    throw new Error(`Field key "${key}" not found in view "${view.id}"`)
  return field
}
