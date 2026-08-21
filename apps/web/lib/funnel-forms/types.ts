export interface AfformFieldOption {
  value: string
  label: string
}

export type AfformInputType =
  | 'text'
  | 'email'
  | 'textarea'
  | 'select'
  | 'checkbox'

export interface AfformField {
  /** Identifies the field in the form state, the options and the submitted payload. */
  formKey: string
  label: string
  inputType: AfformInputType
  /** Inline options; when absent they are looked up in `AfformOptions` by `formKey`. */
  options?: AfformFieldOption[] | null
  /** Rendered as rows the visitor can add to, and submitted as an array. */
  repeatable?: boolean
}

export interface AfformConfig {
  confirmationMessage: string
  fields: AfformField[]
}

export interface AfformOptions {
  skills?: AfformFieldOption[]
  chatService?: AfformFieldOption[]
  country?: AfformFieldOption[]
  [key: string]: AfformFieldOption[] | undefined
}
