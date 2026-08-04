'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@acid-info/logos-ui'
import { useForm } from 'react-hook-form'

import {
  createOrganisationSchema,
  type CreateOrganisationInput,
  type OrganisationRecord,
} from '@/contracts/directory'

import { FormField, RecordDialog } from './record-dialog'

interface NewOrganisationDialogProps {
  isSaving: boolean
  onClose: () => void
  onCreate: (input: CreateOrganisationInput) => Promise<void>
  item?: OrganisationRecord
}

export function NewOrganisationDialog({
  isSaving,
  onClose,
  onCreate,
  item,
}: NewOrganisationDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CreateOrganisationInput>({
    resolver: zodResolver(createOrganisationSchema),
    defaultValues: {
      displayName: item?.displayName ?? '',
      domain: item?.domain ?? '',
      website: item?.website ?? '',
      status: item?.status ?? 'prospect',
      summary: item?.summary ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    await onCreate(values)
    reset()
  })

  return (
    <RecordDialog
      kicker="Relationship directory"
      onClose={onClose}
      title={item ? 'Edit organisation' : 'Add an organisation'}
    >
      <form className="case-form" onSubmit={submit}>
        <FormField
          label="Organisation name"
          error={errors.displayName?.message}
        >
          <input
            {...register('displayName')}
            autoFocus
            placeholder="Organisation name"
          />
        </FormField>
        <div className="form-row">
          <FormField label="Domain" error={errors.domain?.message}>
            <input {...register('domain')} placeholder="example.org" />
          </FormField>
          <FormField label="Status" error={errors.status?.message}>
            <select {...register('status')}>
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
        </div>
        <FormField label="Website" error={errors.website?.message}>
          <input {...register('website')} placeholder="https://example.org" />
        </FormField>
        <FormField label="Summary" error={errors.summary?.message}>
          <textarea
            {...register('summary')}
            rows={4}
            placeholder="What should coordinators know?"
          />
        </FormField>
        <div className="dialog-actions">
          <Button className="cursor-pointer" disabled={isSaving} type="submit">
            {isSaving
              ? 'Saving organisation'
              : item
                ? 'Save organisation'
                : 'Add organisation'}
          </Button>
        </div>
      </form>
    </RecordDialog>
  )
}
