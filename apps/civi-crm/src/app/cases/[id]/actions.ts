'use server'

export async function updateCase(
  _caseId: string,
  _fields: Record<string, unknown>
): Promise<void> {
  throw new Error('Not implemented')
}

export async function updateContact(
  _contactId: string,
  _fields: Record<string, unknown>
): Promise<void> {
  throw new Error('Not implemented')
}

export async function swapCoordinator(
  _caseId: string,
  _newCoordinatorContactId: string
): Promise<void> {
  throw new Error('Not implemented')
}
