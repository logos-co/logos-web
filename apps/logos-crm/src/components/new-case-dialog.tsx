'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@acid-info/logos-ui'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'

import { createCaseSchema, type CreateCaseInput } from '@/contracts/case'

const formSchema = createCaseSchema.omit({ nextActionAt: true }).extend({
  nextActionAt: z.string().min(1, 'Choose a due date.'),
})

type CaseFormValues = z.infer<typeof formSchema>

interface NewCaseDialogProps {
  isOpen: boolean
  isSaving: boolean
  onClose: () => void
  onCreate: (input: CreateCaseInput) => Promise<void>
}

const defaultDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 16)

export function NewCaseDialog({
  isOpen,
  isSaving,
  onClose,
  onCreate,
}: NewCaseDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      organisation: '',
      owner: 'Mara Chen',
      stage: 'Intake',
      priority: 'medium',
      nextAction: '',
      nextActionAt: defaultDueDate,
    },
  })

  if (!isOpen) return null

  const submit = handleSubmit(async (values) => {
    await onCreate({
      ...values,
      nextActionAt: new Date(values.nextActionAt).toISOString(),
    })
    reset()
  })

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="new-case-title"
        aria-modal="true"
        className="dialog-panel"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <p className="utility-label">New record</p>
            <h2 id="new-case-title">Open a case</h2>
          </div>
          <button
            className="text-action cursor-pointer"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <form className="case-form" onSubmit={submit}>
          <FormField label="Case title" error={errors.title?.message}>
            <input
              {...register('title')}
              autoFocus
              placeholder="What are we coordinating?"
            />
          </FormField>

          <div className="form-row">
            <FormField
              label="Organisation"
              error={errors.organisation?.message}
            >
              <input
                {...register('organisation')}
                placeholder="Organisation name"
              />
            </FormField>
            <FormField label="Owner" error={errors.owner?.message}>
              <select {...register('owner')}>
                <option>Mara Chen</option>
                <option>Jon Bell</option>
                <option>Niko Reyes</option>
              </select>
            </FormField>
          </div>

          <div className="form-row">
            <FormField label="Stage" error={errors.stage?.message}>
              <select {...register('stage')}>
                <option>Intake</option>
                <option>Discovery</option>
                <option>Qualification</option>
                <option>Proposal</option>
              </select>
            </FormField>
            <FormField label="Priority" error={errors.priority?.message}>
              <select {...register('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </FormField>
          </div>

          <FormField label="Next action" error={errors.nextAction?.message}>
            <input
              {...register('nextAction')}
              placeholder="Describe the next concrete step"
            />
          </FormField>

          <FormField label="Due" error={errors.nextActionAt?.message}>
            <input {...register('nextActionAt')} type="datetime-local" />
          </FormField>

          <div className="dialog-actions">
            <Button
              className="cursor-pointer"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Creating case' : 'Create case'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

function FormField({
  children,
  error,
  label,
}: {
  children: React.ReactNode
  error?: string
  label: string
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  )
}
