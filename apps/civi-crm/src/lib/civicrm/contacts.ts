import { civiClient } from './client'
import type { CiviContact, CiviEmail } from './types'
import type { ContactDetail } from '@/types/contact'

export async function getContactById(
  contactId: string
): Promise<ContactDetail> {
  const rows = await civiClient.get<CiviContact>('Contact', {
    select: ['id', 'first_name', 'last_name', 'display_name', 'email_primary'],
    where: [['id', '=', Number(contactId)]],
  })
  const contact = rows[0]
  if (!contact) throw new Error(`Contact ${contactId} not found`)
  return {
    contactId: String(contact.id),
    fieldValues: {
      first_name: contact.first_name,
      last_name: contact.last_name,
      display_name: contact.display_name,
      email_primary: contact.email_primary,
    },
  }
}

export async function updateContact(
  contactId: string,
  civiValues: Record<string, unknown>
): Promise<void> {
  await civiClient.update(
    'Contact',
    [['id', '=', Number(contactId)]],
    civiValues
  )
}

export async function updateEmail(
  contactId: string,
  email: string
): Promise<void> {
  const emails = await civiClient.get<CiviEmail>('Email', {
    select: ['id'],
    where: [
      ['contact_id', '=', Number(contactId)],
      ['is_primary', '=', true],
    ],
  })
  if (emails[0]) {
    await civiClient.update('Email', [['id', '=', emails[0].id]], { email })
  } else {
    await civiClient.create('Email', {
      contact_id: Number(contactId),
      email,
      is_primary: true,
    })
  }
}

export async function resolveOrCreateContactByEmail(
  email: string
): Promise<string> {
  const contacts = await civiClient.get<CiviContact>('Contact', {
    select: ['id'],
    where: [['email_primary', '=', email]],
    limit: 1,
  })
  if (contacts[0]) return String(contacts[0].id)
  const created = await civiClient.create<CiviContact>('Contact', {
    contact_type: 'Individual',
    email_primary: email,
  })
  return String(created.id)
}
