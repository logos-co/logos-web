'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@acid-info/logos-ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'

import {
  createCaseSchema,
  type CasePriority,
  type CreateCaseInput,
} from '@/contracts/case'
import {
  defaultStageFor,
  getPipeline,
  pipelineList,
} from '@/contracts/pipeline'
import type { OrganisationRecord, PersonRecord } from '@/contracts/directory'
import type { PipelineKey } from '@/contracts/pipeline'
import type { UserRecord } from '@/contracts/user'
import { apiClient } from '@/lib/api-client'

import { Combobox, type ComboboxOption } from './combobox'
import { FormField, RecordDialog } from './record-dialog'

/**
 * Owner and next action are optional here for the same reason they are nullable
 * in the schema: a case can legitimately start unassigned and untriaged, and
 * the empty option has to mean "unassigned" rather than forcing a guess.
 */
const PRIORITY_OPTIONS: ComboboxOption[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
]

const formSchema = createCaseSchema
  .omit({
    nextAction: true,
    nextActionAt: true,
    organisationId: true,
    organisationName: true,
    ownerUserId: true,
    personIds: true,
  })
  .extend({
    nextAction: z.string().trim().max(240),
    nextActionAt: z.string(),
    /**
     * A name, not an id. Restricting this to organisations already in the CRM
     * meant a coordinator with a new lead had to leave, create the
     * organisation, and come back - so the datalist suggests what exists and
     * accepts anything else, and the server matches or creates on submit.
     */
    organisationName: z
      .string()
      .trim()
      .min(2, 'Name the organisation.')
      .max(160),
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
  const queryClient = useQueryClient()
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<CaseFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    defaultValues: {
      title: '',
      organisationName: '',
      personId: '',
      ownerUserId: '',
      pipeline: 'ecodev',
      stage: defaultStageFor('ecodev'),
      priority: 'medium',
      nextAction: '',
      nextActionAt: defaultDueDate(),
    },
  })

  const pipeline = watch('pipeline')
  const stage = watch('stage')
  const priority = watch('priority')
  const organisationName = watch('organisationName')
  const ownerUserId = watch('ownerUserId')
  const personId = watch('personId')

  const organisationOptions = useMemo<ComboboxOption[]>(
    () =>
      organisations.map((item) => ({
        id: item.id,
        label: item.displayName,
        hint: item.domain ?? undefined,
      })),
    [organisations]
  )
  const ownerOptions = useMemo<ComboboxOption[]>(
    () =>
      users.map((item) => ({
        id: item.id,
        label: item.displayName,
        // Shown and searchable, so typing an address finds the person and a
        // derived one is visible rather than silently assumed.
        hint: item.email,
      })),
    [users]
  )
  const pipelineOptions = useMemo<ComboboxOption[]>(
    () => pipelineList.map((item) => ({ id: item.key, label: item.label })),
    []
  )
  const stageOptions = useMemo<ComboboxOption[]>(
    () =>
      getPipeline(pipeline).stages.map((item) => ({
        id: item.key,
        label: item.label,
      })),
    [pipeline]
  )
  const personOptions = useMemo<ComboboxOption[]>(
    () =>
      people.map((item) => ({
        id: item.id,
        label: item.fullName,
        hint: item.organisationName ?? undefined,
      })),
    [people]
  )

  /**
   * Creating a person from here records a name and nothing else. Consent and
   * contact details stay unset rather than being inferred from the fact that
   * somebody typed a name into a case form - the person has not agreed to
   * anything yet, and a default that says otherwise is the kind of claim this
   * app exists to avoid making.
   */
  const createPersonMutation = useMutation({
    mutationFn: (fullName: string) =>
      apiClient<{ item: PersonRecord }>('/api/v1/people', {
        method: 'POST',
        body: JSON.stringify({ fullName }),
      }),
    onSuccess: async ({ item }) => {
      await queryClient.invalidateQueries({ queryKey: ['people'] })
      setValue('personId', item.id)
    },
  })

  const onCreatePerson = (fullName: string): void => {
    createPersonMutation.mutate(fullName)
  }

  /**
   * Adding a coordinator from here. The typed text is taken as an address when
   * it looks like one and as a name otherwise; the server derives the missing
   * half either way, and returns the existing account when the address already
   * belongs to somebody.
   */
  const createUserMutation = useMutation({
    mutationFn: (typed: string) =>
      apiClient<{ item: UserRecord }>('/api/v1/users', {
        method: 'POST',
        body: JSON.stringify(
          typed.includes('@')
            ? {
                displayName:
                  typed.split('@')[0]?.replace(/[._]+/g, ' ') ?? typed,
                email: typed,
              }
            : { displayName: typed }
        ),
      }),
    onSuccess: async ({ item }) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      setValue('ownerUserId', item.id)
    },
  })

  if (!isOpen) return null

  const submit = handleSubmit(async (values) => {
    const {
      personId,
      ownerUserId,
      nextAction,
      nextActionAt,
      organisationName,
      ...caseValues
    } = values
    // Sent as a name whether or not it matches something on screen. The server
    // owns "is this the same organisation", because the browser's copy of the
    // list is always a moment behind.
    await onCreate({
      ...caseValues,
      organisationName,
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
            error={errors.organisationName?.message}
          >
            {/*
              Keyed by name rather than id: the server matches an existing
              organisation on its normalised name and creates one otherwise, so
              a lead whose organisation is new needs no detour through the
              directory.
            */}
            <Combobox
              displayValue={organisationName}
              invalid={Boolean(errors.organisationName)}
              label="Organisation"
              options={organisationOptions}
              placeholder="Search, or type a new name"
              value={
                organisationOptions.find(
                  (option) => option.label === organisationName
                )?.id ?? null
              }
              onChange={(id) =>
                setValue(
                  'organisationName',
                  organisationOptions.find((option) => option.id === id)
                    ?.label ?? '',
                  { shouldValidate: true }
                )
              }
              onCreate={(name) =>
                setValue('organisationName', name, { shouldValidate: true })
              }
            />
          </FormField>
          <FormField label="Owner" error={errors.ownerUserId?.message}>
            {/* No create: a coordinator is an account, not something a case
                form may conjure. */}
            <Combobox
              emptyOptionLabel="Unassigned"
              label="Owner"
              options={ownerOptions}
              placeholder="Search, or type a name to add"
              value={ownerUserId || null}
              onChange={(id) => setValue('ownerUserId', id ?? '')}
              onCreate={(typed) => createUserMutation.mutate(typed)}
            />
          </FormField>
        </div>

        <FormField label="Primary contact" error={errors.personId?.message}>
          <Combobox
            emptyOptionLabel="No primary contact"
            label="Primary contact"
            options={personOptions}
            placeholder="Search people, or type a new name"
            value={personId || null}
            onChange={(id) => setValue('personId', id ?? '')}
            onCreate={onCreatePerson}
          />
        </FormField>

        <div className="form-row">
          <FormField label="Pipeline" error={errors.pipeline?.message}>
            {/* Pick-only: no `onCreate`, so no add row. A pipeline is a
                catalogue in code, not something a case form may invent. */}
            <Combobox
              label="Pipeline"
              options={pipelineOptions}
              value={pipeline}
              onChange={(key) => {
                if (!key) return
                setValue('pipeline', key as PipelineKey)
                // Stage keys are not shared between pipelines, so a stage left
                // over from the previous choice would fail validation with an
                // error the user cannot see the cause of. Reset it to the new
                // pipeline's first stage instead.
                setValue('stage', defaultStageFor(key as PipelineKey))
              }}
            />
          </FormField>
          <FormField label="Stage" error={errors.stage?.message}>
            <Combobox
              label="Stage"
              options={stageOptions}
              value={stage}
              onChange={(key) => key && setValue('stage', key)}
            />
          </FormField>
          <FormField label="Priority" error={errors.priority?.message}>
            <Combobox
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={(key) =>
                key && setValue('priority', key as CasePriority)
              }
            />
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
