import type { AfformField, AfformOptions } from '@/lib/funnel-forms/types'

export interface FieldOption {
  value: string
  label: string
}

export function getOptionsForField(
  field: { formKey: string; options?: AfformField['options'] },
  afformOptions: AfformOptions
): FieldOption[] {
  if (field.options && field.options.length > 0) {
    return field.options.map((o) => ({ value: o.value, label: o.label }))
  }

  const fromAfform = afformOptions[field.formKey]
  if (fromAfform && fromAfform.length > 0) {
    return fromAfform.map((o) => ({ value: o.value, label: o.label }))
  }

  return []
}
