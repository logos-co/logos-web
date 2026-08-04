'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@acid-info/logos-ui'
import { useForm } from 'react-hook-form'

import {
  createPersonSchema,
  type CreatePersonInput,
  type OrganisationRecord,
  type PersonRecord,
} from '@/contracts/directory'

import { FormField, RecordDialog } from './record-dialog'

interface NewPersonDialogProps {
  isSaving: boolean
  onClose: () => void
  onCreate: (input: CreatePersonInput) => Promise<void>
  organisations: OrganisationRecord[]
  item?: PersonRecord
}

export function NewPersonDialog({
  isSaving,
  onClose,
  onCreate,
  organisations,
  item,
}: NewPersonDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CreatePersonInput>({
    resolver: zodResolver(createPersonSchema),
    defaultValues: {
      fullName: item?.fullName ?? '',
      preferredName: item?.preferredName ?? '',
      roleTitle: item?.roleTitle ?? '',
      email: item?.email ?? '',
      phone: item?.phone ?? '',
      organisationId: item?.organisationId ?? undefined,
      status: item?.status ?? 'prospect',
      summary: item?.summary ?? '',
    },
  })

  const submit = handleSubmit(async (values) => {
    await onCreate({
      ...values,
      organisationId: values.organisationId || undefined,
    })
    reset()
  })

  return (
    <RecordDialog
      kicker="Relationship directory"
      onClose={onClose}
      title={item ? 'Edit person' : 'Add a person'}
    >
      <form className="case-form" onSubmit={submit}>
        <div className="form-row">
          <FormField label="Full name" error={errors.fullName?.message}>
            <input
              {...register('fullName')}
              autoFocus
              placeholder="Full name"
            />
          </FormField>
          <FormField
            label="Preferred name"
            error={errors.preferredName?.message}
          >
            <input {...register('preferredName')} placeholder="Optional" />
          </FormField>
        </div>
        <div className="form-row">
          <FormField
            label="Organisation"
            error={errors.organisationId?.message}
          >
            <select {...register('organisationId')}>
              <option value="">No organisation</option>
              {organisations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Role" error={errors.roleTitle?.message}>
            <input {...register('roleTitle')} placeholder="Role or title" />
          </FormField>
        </div>
        <div className="form-row">
          <FormField label="Email" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="name@example.org"
            />
          </FormField>
          <FormField label="Telephone" error={errors.phone?.message}>
            <input {...register('phone')} type="tel" placeholder="Optional" />
          </FormField>
        </div>
        <FormField label="Status" error={errors.status?.message}>
          <select {...register('status')}>
            <option value="prospect">Prospect</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>
        <FormField label="Summary" error={errors.summary?.message}>
          <textarea
            {...register('summary')}
            rows={4}
            placeholder="Context, interests, and coordination notes"
          />
        </FormField>
        <div className="dialog-actions">
          <Button className="cursor-pointer" disabled={isSaving} type="submit">
            {isSaving ? 'Saving person' : item ? 'Save person' : 'Add person'}
          </Button>
        </div>
      </form>
    </RecordDialog>
  )
}
