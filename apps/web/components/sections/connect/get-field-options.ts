import type { AfformField, AfformOptions } from '@/lib/civicrm/types'

export interface FieldOption {
  value: string
  label: string
}

export function getOptionsForField(
  field: { formKey: string; options?: AfformField['options'] },
  afformOptions: AfformOptions
): FieldOption[] {
  if (field.options && field.options.length > 0) {
    return field.options.map((o) => ({
      value: String(o.id ?? o.value ?? ''),
      label: o.label ?? String(o.id ?? o.value ?? ''),
    }))
  }

  const fromAfform = afformOptions[field.formKey]
  if (fromAfform && Array.isArray(fromAfform) && fromAfform.length > 0) {
    return fromAfform.map((o) => ({
      value: String(o.value),
      label: o.label ?? o.name ?? String(o.value),
    }))
  }

  return []
}
