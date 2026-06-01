/**
 * Case custom-field defaults applied on Afform.submit for intake forms.
 *
 * Option value IDs from CiviCRM Circle_Case.Profile and Circle_Case.Lead_Source
 * (OptionValue.get on the Logos instance, May 2026).
 */
export const FORM_CASE_DEFAULTS = {
  afformActivistBuilder: {
    'Circle_Case.Profile': ['2'], // Activist Builder
    'Circle_Case.Lead_Source': ['2'], // Activist Builder Form
  },
  afformActivistLeaderSteward: {
    'Circle_Case.Profile': ['1'], // Circle Steward
    'Circle_Case.Lead_Source': ['1'], // Activist Steward Form (CiviCRM label)
  },
  afformCoalitionPartner: {
    'Circle_Case.Profile': ['3'], // Coalition Partner
    'Circle_Case.Lead_Source': ['3'], // Coalition Partner Form
  },
} as const

export type AfformIntakeFormName = keyof typeof FORM_CASE_DEFAULTS

export function isAfformIntakeFormName(
  formName: string
): formName is AfformIntakeFormName {
  return formName in FORM_CASE_DEFAULTS
}

export function getCaseDefaultsForForm(formName: AfformIntakeFormName) {
  return FORM_CASE_DEFAULTS[formName]
}
