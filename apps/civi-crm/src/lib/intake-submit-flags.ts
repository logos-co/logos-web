const TRUTHY = new Set(['1', 'true', 'yes', 'on'])

function isEnvFlagEnabled(value: string | undefined): boolean {
  if (!value?.trim()) return false
  return TRUTHY.has(value.trim().toLowerCase())
}

/** When `FUNNEL_INTAKE_NOTION_DISABLED` is unset or not truthy, Notion intake submit runs. */
export function isNotionIntakeSubmitEnabled(): boolean {
  return !isEnvFlagEnabled(process.env.FUNNEL_INTAKE_NOTION_DISABLED)
}

/** When `FUNNEL_INTAKE_CIVICRM_DISABLED` is unset or not truthy, CiviCRM intake submit runs. */
export function isCiviCrmIntakeSubmitEnabled(): boolean {
  return !isEnvFlagEnabled(process.env.FUNNEL_INTAKE_CIVICRM_DISABLED)
}
