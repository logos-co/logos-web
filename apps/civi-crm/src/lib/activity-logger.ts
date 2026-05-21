export type FieldChange = {
  key: string
  label: string
  from: unknown
  to: unknown
}

export type ActivityTarget =
  | { type: 'case'; caseId: string; contactId: string }
  | { type: 'contact'; contactId: string }

// Orchestrates CiviCRM Activity creation on successful mutations.
// Called from PATCH handlers only after all writes succeed.
// Activity creation failure is logged server-side but does not fail the mutation response.

export async function logActivity(
  _userEmail: string,
  _target: ActivityTarget,
  _changes: FieldChange[]
): Promise<void> {
  throw new Error('Not implemented')
}
