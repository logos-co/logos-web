'use client'

import HCaptcha from '@hcaptcha/react-hcaptcha'
import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'

import { Button } from '@/components/ui/button'
import { buildFormSchema } from '@/lib/civicrm/contactFormSchema'
import type {
  AfformConfig,
  AfformField,
  AfformOptions,
} from '@/lib/civicrm/types'
import { cn } from '@/lib/cn'

import { getOptionsForField } from './get-field-options'
import {
  FieldLabel,
  MultiselectField,
  SelectField,
  TextInput,
  TextareaInput,
} from './form'

type FormValues = Record<string, string | string[] | boolean>

// Notion stores websites in discrete columns (Website, Website 2 ... Website 5),
// so the funnel caps the repeatable website field at five rows.
const MAX_WEBSITE_ROWS = 5

type Props = {
  afform: AfformConfig
  afformOptions?: AfformOptions
  apiEndpoint: string
  pagePrivacy?: string
  pagePrivacyLink?: string
  extraPayload?: Record<string, string>
  className?: string
}

function capitalizeLabel(label: string) {
  if (!label) return ''
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function buildInitialData(fields: AfformField[]): FormValues {
  const data: FormValues = { socials: '' }
  for (const field of fields) {
    if (field.formKey === 'role' || field.formKey === 'skills') {
      data[field.formKey] = []
    } else if (field.formKey === 'chat' || field.formKey === 'chatService') {
      data[field.formKey] = ['']
    } else if (field.repeatable) {
      data[field.formKey] = ['']
    } else {
      data[field.formKey] = field.inputType === 'checkbox' ? true : ''
    }
  }
  return data
}

export function ConnectFormSection({
  afform,
  afformOptions = {},
  apiEndpoint,
  pagePrivacy = '',
  pagePrivacyLink = '',
  extraPayload = {},
  className,
}: Props) {
  const t = useTranslations('connectForm')

  const formFieldsWithKeys = useMemo(
    () =>
      (afform.fields ?? []).filter(
        (f) => f.formKey && f.inputType && f.inputType !== 'hidden'
      ),
    [afform.fields]
  )

  const { schema: formSchema, requiredFields: REQUIRED_FIELDS } = useMemo(
    () => buildFormSchema(afform.fields ?? []),
    [afform.fields]
  )

  const initialData = useMemo(
    () => buildInitialData(formFieldsWithKeys),
    [formFieldsWithKeys]
  )

  const [formData, setFormData] = useState<FormValues>(initialData)
  const [submitable, setSubmitable] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [loadingState, setLoadingState] = useState(false)
  const [successState, setSuccessState] = useState(false)
  const [serverError, setServerError] = useState('')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  const hcaptchaSitekey = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY
  const hcaptchaEnabled = !!hcaptchaSitekey

  const validate = useCallback(() => {
    const result = formSchema.safeParse(formData)
    if (result.success) {
      setErrors([])
      setSubmitable(!loadingState)
    } else {
      const fieldErrors = [
        ...new Set(
          result.error.issues
            .map((issue) => issue.path[0])
            .filter((p): p is string | number => p != null)
            .map(String)
        ),
      ]
      setErrors(fieldErrors)
      setSubmitable(false)
    }
  }, [formData, loadingState, formSchema])

  useEffect(() => {
    validate()
  }, [validate])

  useEffect(() => {
    if (!successState) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [successState])

  const handleChange =
    (field: string) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => {
      const value = typeof event === 'string' ? event : event.target.value
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

  const handleChangeRepeatable =
    (fieldKey: string, index: number) =>
    (event: ChangeEvent<HTMLInputElement> | string) => {
      const value =
        typeof event === 'string' ? event : (event?.target?.value ?? '')
      setFormData((prev) => {
        const current = prev[fieldKey]
        let arr: string[]
        if (Array.isArray(current)) {
          arr = [...current.map(String)]
        } else {
          const single = String(current ?? '')
          arr = single.trim() !== '' ? [single, ''] : [single]
        }
        arr[index] = value
        return { ...prev, [fieldKey]: arr }
      })
    }

  const handleAddRepeatable = (fieldKey: string) => () => {
    setFormData((prev) => {
      const current = prev[fieldKey]
      const arr = Array.isArray(current)
        ? [...current.map(String)]
        : [String(current ?? '')]
      if (fieldKey === 'website' && arr.length >= MAX_WEBSITE_ROWS) {
        return prev
      }
      return { ...prev, [fieldKey]: [...arr, ''] }
    })
  }

  const handleRemoveRepeatable = (fieldKey: string, index: number) => () => {
    setFormData((prev) => {
      const arr = Array.isArray(prev[fieldKey])
        ? [...prev[fieldKey].map(String)]
        : [String(prev[fieldKey] ?? '')]
      if (arr.length <= 1) return prev
      return { ...prev, [fieldKey]: arr.filter((_, i) => i !== index) }
    })
  }

  const handleAddChatRow = () => {
    setFormData((prev) => ({
      ...prev,
      chat: [
        ...(Array.isArray(prev.chat)
          ? prev.chat.map(String)
          : [String(prev.chat ?? '')]),
        '',
      ],
      chatService: [
        ...(Array.isArray(prev.chatService)
          ? prev.chatService.map(String)
          : [String(prev.chatService ?? '')]),
        '',
      ],
    }))
  }

  const handleRemoveChatRow = (index: number) => () => {
    setFormData((prev) => {
      const chat = Array.isArray(prev.chat)
        ? [...prev.chat.map(String)]
        : [String(prev.chat ?? '')]
      const chatService = Array.isArray(prev.chatService)
        ? [...prev.chatService.map(String)]
        : [String(prev.chatService ?? '')]
      if (chat.length <= 1) return prev
      return {
        ...prev,
        chat: chat.filter((_, i) => i !== index),
        chatService: chatService.filter((_, i) => i !== index),
      }
    })
  }

  const handleCheckbox =
    (field: string) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.checked }))
    }

  const handleMultiselectToggle =
    (fieldKey: string, optionValue: string) => () => {
      setFormData((prev) => {
        const current = prev[fieldKey]
        const arr = Array.isArray(current)
          ? [...current.map(String)]
          : current
            ? [String(current)]
            : []
        const idx = arr.indexOf(optionValue)
        const next =
          idx === -1 ? [...arr, optionValue] : arr.filter((_, i) => i !== idx)
        return { ...prev, [fieldKey]: next }
      })
    }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError('')

    if (!submitable) {
      setFormErrors(errors)
      return
    }

    if (hcaptchaEnabled && !captchaToken) {
      setServerError(t('captchaRequired'))
      return
    }

    setLoadingState(true)
    setFormErrors([])

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          captchaToken,
          fields: afform.fields,
          ...extraPayload,
        }),
      })

      const result = (await res.json()) as { error?: string }

      if (!res.ok) {
        setServerError(result.error || t('submitError'))
        setLoadingState(false)
        setCaptchaToken(null)
        captchaRef.current?.resetCaptcha()
        return
      }

      setSuccessState(true)
      setLoadingState(false)
    } catch {
      setServerError(t('networkError'))
      setLoadingState(false)
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()
    }
  }

  const hasError = (field: string) =>
    formErrors.length > 0 && errors.includes(field)

  const getAnnouncementMessage = () => {
    if (successState) return t('successAnnouncement')
    if (loadingState) return t('loadingAnnouncement')
    if (formErrors.length > 0) {
      return t('errorsAnnouncement', { count: formErrors.length })
    }
    return ''
  }

  if (successState) {
    const confirmationMessage =
      afform.confirmationMessage || t('defaultConfirmation')
    return (
      <div className={className}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="py-16 text-center"
        >
          <div className="mb-6 inline-flex size-16 items-center justify-center rounded-full border-2 border-brand-dark-green">
            <Check className="size-8" aria-hidden />
          </div>
          <h3 className="mb-4 font-sans text-[24px] leading-[1.1] tracking-[-0.24px] text-brand-dark-green">
            {confirmationMessage}
          </h3>
          <p className="mx-auto max-w-[40em] text-balance font-mono text-[10px] leading-[1.3] text-brand-dark-green/80">
            {t('successBody')}
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {getAnnouncementMessage()}
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        {formFieldsWithKeys.map((field) => {
          const value = formData[field.formKey]
          const hasFieldError = hasError(field.formKey)
          const label = capitalizeLabel(field.label)
          const placeholder =
            field.inputType === 'select' ? t('selectPlaceholder') : ''

          if (field.formKey === 'role' || field.formKey === 'skills') {
            const options = getOptionsForField(field, afformOptions)
            const selected = Array.isArray(value)
              ? value.map(String)
              : value
                ? [String(value)]
                : []
            return (
              <MultiselectField
                key={field.formKey}
                id={`${field.formKey}-trigger`}
                label={label}
                options={options}
                value={selected}
                onToggleOption={(opt) =>
                  handleMultiselectToggle(field.formKey, opt)()
                }
                required={REQUIRED_FIELDS.has(field.formKey)}
                disabled={loadingState}
                error={hasFieldError}
                errorMessage={
                  REQUIRED_FIELDS.has(field.formKey)
                    ? t('selectAtLeastOne')
                    : null
                }
                isOpen={openDropdown === field.formKey}
                onToggle={() =>
                  setOpenDropdown((k) =>
                    k === field.formKey ? null : field.formKey
                  )
                }
                onClose={() => setOpenDropdown(null)}
              />
            )
          }

          if (field.formKey === 'chatService') return null

          if (field.formKey === 'chat') {
            const chatValues = Array.isArray(formData.chat)
              ? formData.chat.map(String)
              : [String(formData.chat ?? '')]
            const chatServiceValues = Array.isArray(formData.chatService)
              ? formData.chatService.map(String)
              : [String(formData.chatService ?? '')]
            const chatServiceOptions = getOptionsForField(
              { formKey: 'chatService' },
              afformOptions
            )

            return (
              <div key="chat" className="w-full space-y-3">
                <FieldLabel>{t('chatLabel')}</FieldLabel>
                {chatValues.map((chatVal, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-stretch gap-2"
                  >
                    <div className="min-w-[120px] flex-1">
                      <TextInput
                        name={`chat[${index}]`}
                        onChange={handleChangeRepeatable('chat', index)}
                        value={chatVal}
                        disabled={loadingState}
                        error={hasError('chat')}
                      />
                    </div>
                    <div className="min-w-[140px] flex-1">
                      <SelectField
                        id={`chatService-${index}`}
                        label=""
                        options={chatServiceOptions}
                        value={chatServiceValues[index] ?? ''}
                        onChange={handleChangeRepeatable('chatService', index)}
                        placeholder={t('chatServicePlaceholder')}
                        disabled={loadingState}
                        error={hasError('chatService')}
                        errorMessage={
                          hasError('chatService')
                            ? t('chatServiceRequired')
                            : null
                        }
                        isOpen={openDropdown === `chatService-${index}`}
                        onToggle={() =>
                          setOpenDropdown((k) =>
                            k === `chatService-${index}`
                              ? null
                              : `chatService-${index}`
                          )
                        }
                        onClose={() => setOpenDropdown(null)}
                      />
                    </div>
                    {chatValues.length > 1 ? (
                      <button
                        type="button"
                        onClick={handleRemoveChatRow(index)}
                        disabled={loadingState}
                        className="shrink-0 self-center font-mono text-[10px] leading-[1.3] text-brand-dark-green/70 hover:text-brand-dark-green"
                        aria-label={t('removeChatRow', { index: index + 1 })}
                      >
                        {t('remove')}
                      </button>
                    ) : null}
                  </div>
                ))}
                {hasError('chat') ? (
                  <p className="font-mono text-[10px] font-semibold text-red-600">
                    {t('chatNameRequired')}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handleAddChatRow}
                  disabled={loadingState}
                  className="text-left font-mono text-[10px] leading-[1.3] text-brand-dark-green/70 hover:text-brand-dark-green"
                  aria-label={t('addChatRow')}
                >
                  {t('addAnother')}
                </button>
              </div>
            )
          }

          if (field.inputType === 'select') {
            const options = getOptionsForField(field, afformOptions)
            return (
              <SelectField
                key={field.formKey}
                id={field.formKey}
                label={label}
                options={options}
                value={String(value ?? '')}
                onChange={handleChange(field.formKey)}
                placeholder={placeholder}
                required={REQUIRED_FIELDS.has(field.formKey)}
                disabled={loadingState}
                error={hasFieldError}
                errorMessage={
                  REQUIRED_FIELDS.has(field.formKey)
                    ? t('selectFieldRequired', { field: label.toLowerCase() })
                    : null
                }
                isOpen={openDropdown === field.formKey}
                onToggle={() =>
                  setOpenDropdown((k) =>
                    k === field.formKey ? null : field.formKey
                  )
                }
                onClose={() => setOpenDropdown(null)}
              />
            )
          }

          if (field.inputType === 'checkbox') {
            const isChecked = value === true
            return (
              <div key={field.formKey} className="w-full">
                <label className="inline-flex cursor-pointer items-start font-mono text-[10px] leading-[1.3]">
                  <input
                    className="sr-only"
                    type="checkbox"
                    name={field.formKey}
                    checked={isChecked}
                    onChange={handleCheckbox(field.formKey)}
                  />
                  <div
                    className={cn(
                      'mt-0.5 mr-3 flex size-[14px] shrink-0 items-center justify-center border border-brand-dark-green',
                      isChecked && 'bg-brand-dark-green/10'
                    )}
                    aria-hidden
                  >
                    <Check
                      className={cn(
                        'size-3',
                        isChecked ? 'text-brand-dark-green' : 'text-transparent'
                      )}
                      aria-hidden
                    />
                  </div>
                  <span>{label}</span>
                </label>
              </div>
            )
          }

          if (field.inputType === 'textarea') {
            return (
              <div key={field.formKey} className="w-full">
                <TextareaInput
                  id={field.formKey}
                  label={
                    <span>
                      {label}
                      {REQUIRED_FIELDS.has(field.formKey) ? (
                        <span className="ml-0.5 text-red-600">*</span>
                      ) : null}
                    </span>
                  }
                  name={field.formKey}
                  placeholder={placeholder}
                  onChange={handleChange(field.formKey)}
                  value={String(value ?? '')}
                  disabled={loadingState}
                  error={hasFieldError}
                />
                {hasFieldError && REQUIRED_FIELDS.has(field.formKey) ? (
                  <p className="mt-2 font-mono text-[10px] font-semibold text-red-600">
                    {t('fieldRequired', { field: label.toLowerCase() })}
                  </p>
                ) : null}
              </div>
            )
          }

          if (field.repeatable || field.formKey === 'website') {
            let values = Array.isArray(value)
              ? value.map(String)
              : [String(value ?? '')]
            if (values.length === 1 && values[0].trim() !== '') {
              values = [values[0], '']
            }
            const canAddRow =
              field.formKey !== 'website' ||
              values.length < MAX_WEBSITE_ROWS
            return (
              <div key={field.formKey} className="w-full space-y-3">
                <FieldLabel>{label}</FieldLabel>
                {values.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <TextInput
                        name={`${field.formKey}[${index}]`}
                        placeholder={placeholder}
                        onChange={handleChangeRepeatable(field.formKey, index)}
                        value={item}
                        disabled={loadingState}
                      />
                    </div>
                    {values.length > 1 ? (
                      <button
                        type="button"
                        onClick={handleRemoveRepeatable(field.formKey, index)}
                        disabled={loadingState}
                        className="shrink-0 self-center font-mono text-[10px] leading-[1.3] text-brand-dark-green/70 hover:text-brand-dark-green"
                        aria-label={t('removeFieldRow', {
                          field: label,
                          index: index + 1,
                        })}
                      >
                        {t('remove')}
                      </button>
                    ) : null}
                  </div>
                ))}
                {canAddRow ? (
                  <button
                    type="button"
                    onClick={handleAddRepeatable(field.formKey)}
                    disabled={loadingState}
                    className="text-left font-mono text-[10px] leading-[1.3] text-brand-dark-green/70 hover:text-brand-dark-green"
                    aria-label={t('addFieldRow', { field: label })}
                  >
                    {t('addAnother')}
                  </button>
                ) : null}
              </div>
            )
          }

          return (
            <div key={field.formKey} className="w-full">
              <TextInput
                id={field.formKey}
                label={
                  <span>
                    {label}
                    {REQUIRED_FIELDS.has(field.formKey) ? (
                      <span className="ml-0.5 text-red-600">*</span>
                    ) : null}
                  </span>
                }
                name={field.formKey}
                type={field.inputType === 'email' ? 'email' : 'text'}
                placeholder={placeholder}
                onChange={handleChange(field.formKey)}
                value={String(value ?? '')}
                error={hasFieldError}
                disabled={loadingState}
              />
              {hasFieldError && REQUIRED_FIELDS.has(field.formKey) ? (
                <p className="mt-2 font-mono text-[10px] font-semibold text-red-600">
                  {field.formKey === 'email'
                    ? t('emailInvalid')
                    : t('fieldRequired', { field: label.toLowerCase() })}
                </p>
              ) : null}
            </div>
          )
        })}

        {serverError ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-[10px] font-semibold text-red-600"
          >
            {serverError}
          </motion.p>
        ) : null}

        {hcaptchaEnabled ? (
          <div className="pt-2">
            <HCaptcha
              ref={captchaRef}
              sitekey={hcaptchaSitekey}
              size="normal"
              theme="light"
              onVerify={(token) => setCaptchaToken(token)}
              onError={() => {
                setCaptchaToken(null)
                setServerError(t('captchaFailed'))
              }}
              onExpire={() => setCaptchaToken(null)}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-6 pt-4 md:flex-row md:items-end md:justify-between">
          {pagePrivacy ? (
            <div className="max-w-[50em]">
              <p className="text-balance font-mono text-[10px] leading-[1.3] text-brand-dark-green/80">
                {pagePrivacyLink && pagePrivacy.includes('Privacy Policy') ? (
                  <>
                    {pagePrivacy.split('Privacy Policy')[0]}
                    <a
                      href={pagePrivacyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:no-underline"
                    >
                      Privacy Policy
                    </a>
                    {pagePrivacy.split('Privacy Policy')[1]}
                  </>
                ) : pagePrivacyLink ? (
                  <>
                    {pagePrivacy}{' '}
                    <a
                      href={pagePrivacyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:no-underline"
                    >
                      {pagePrivacyLink.replace(/^https?:\/\//, '')}
                    </a>
                  </>
                ) : (
                  pagePrivacy
                )}
              </p>
            </div>
          ) : null}
          <div className="shrink-0">
            <Button
              type="submit"
              variant="primary"
              icon={false}
              disabled={loadingState || (hcaptchaEnabled && !captchaToken)}
              className={cn(
                (loadingState || (hcaptchaEnabled && !captchaToken)) &&
                  'pointer-events-none opacity-60'
              )}
            >
              {loadingState ? t('submitting') : t('submit')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
