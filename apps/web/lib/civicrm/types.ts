export interface AfformField {
  entity: string
  join: string | null
  fieldName: string
  label: string
  required: boolean
  options: Array<{ id?: string; value?: string; label: string }> | null
  inputAttrs: unknown[]
  formKey: string
  inputType: string
  repeatable?: boolean
}

export interface AfformConfig {
  formName: string
  title: string
  serverRoute: string
  confirmationMessage: string
  submitEnabled: boolean
  createSubmission: boolean
  pageHeading: string
  pageIntro: string
  pagePrivacy: string
  pagePrivacyLink: string
  fields: AfformField[]
}

export interface AfformOptions {
  role?: Array<{ value: string; label: string; name?: string }>
  skills?: Array<{ value: string; label: string; name?: string }>
  chatService?: Array<{ value: string; label: string; name?: string }>
  country?: Array<{ value: string; label: string; name?: string }>
  [key: string]: Array<{ value: string; label: string; name?: string }> | undefined
}

export interface ConnectFormConfig {
  afform: AfformConfig
  afformOptions: AfformOptions
  apiEndpoint: string
  extraPayload?: Record<string, string>
}
