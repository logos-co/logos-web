'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@acid-info/logos-ui'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'

import { createCaseSchema, type CreateCaseInput } from '@/contracts/case'
import type { OrganisationRecord, PersonRecord } from '@/contracts/directory'
import type { UserRecord } from '@/contracts/user'

import { FormField, RecordDialog } from './record-dialog'

/**
 * Owner and next action are optional here for the same reason they are nullable
 * in the schema: a case can legitimately start unassigned and untriaged, and
 * the empty option has to mean "unassigned" rather than forcing a guess.
 */
const formSchema = createCaseSchema
  .omit({
    nextAction: true,
    nextActionAt: true,
    organisationId: true,
    ownerUserId: true,
    personIds: true,
  })
  .extend({
    nextAction: z.string().trim().max(240),
    nextActionAt: z.string(),
    organisationId: z.string().uuid('Choose an organisation.'),
    ownerUserId: z.union([z.string().uuid(), z.literal('')]),
    personId: z.union([z.string().uuid(), z.literal('')]),
  })
  .refine(
    (value) => value.nextAction.length === 0 || value.nextAction.length >= 3,
    {
      message: 'Describe the next step, or leave it empty.',
      path: ['nextAction'],
    }
  )
  .refine(
    (value) => value.nextAction.length === 0 || value.nextActionAt.length > 0,
    {
      message: 'A next action needs a due date.',
      path: ['nextActionAt'],
    }
  )

type CaseFormValues = z.infer<typeof formSchema>

interface NewCaseDialogProps {
  isOpen: boolean
  isSaving: boolean
  onClose: () => void
  onCreate: (input: CreateCaseInput) => Promise<void>
  organisations: OrganisationRecord[]
  people: PersonRecord[]
  users: UserRecord[]
}

function defaultDueDate(): string {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function NewCaseDialog({
  isOpen,
  isSaving,
  onClose,
  onCreate,
  organisations,
  people,
  users,
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
      organisationId: '',
      personId: '',
      ownerUserId: '',
      stage: 'Intake',
      priority: 'medium',
      nextAction: '',
      nextActionAt: defaultDueDate(),
    },
  })

  if (!isOpen) return null

  const submit = handleSubmit(async (values) => {
    const { personId, ownerUserId, nextAction, nextActionAt, ...caseValues } =
      values
    await onCreate({
      ...caseValues,
      ...(ownerUserId ? { ownerUserId } : {}),
      ...(nextAction
        ? {
            nextAction,
            nextActionAt: new Date(nextActionAt).toISOString(),
          }
        : {}),
      personIds: personId ? [personId] : [],
    })
    reset()
  })

  return (
    <RecordDialog kicker="New record" onClose={onClose} title="Open a case">
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
            error={errors.organisationId?.message}
          >
            <select {...register('organisationId')}>
              <option value="">Choose organisation</option>
              {organisations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Owner" error={errors.ownerUserId?.message}>
            <select {...register('ownerUserId')}>
              <option value="">Unassigned</option>
              {users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Primary contact" error={errors.personId?.message}>
          <select {...register('personId')}>
            <option value="">No primary contact</option>
            {people.map((item) => (
              <option key={item.id} value={item.id}>
                {item.fullName}
                {item.organisationName ? ` · ${item.organisationName}` : ''}
              </option>
            ))}
          </select>
        </FormField>

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
            placeholder="Leave empty to triage later"
          />
        </FormField>

        <FormField label="Due" error={errors.nextActionAt?.message}>
          <input {...register('nextActionAt')} type="datetime-local" />
        </FormField>

        <div className="dialog-actions">
          <Button className="cursor-pointer" type="submit" disabled={isSaving}>
            {isSaving ? 'Creating case' : 'Create case'}
          </Button>
        </div>
      </form>
    </RecordDialog>
  )
}
