import { Suspense } from 'react'
import { connection } from 'next/server'
import { headers } from 'next/headers'
import { getBaseUrl } from '@/lib/server-url'
import { getActiveView } from '@/lib/views'
import { resolveOrCreateContactByEmail } from '@/lib/civicrm/contacts'
import CasesFilters from '@/components/cases/CasesFilters'
import CasesTable from '@/components/cases/CasesTable'
import type { CaseListItem, PaginatedResponse } from '@/types/case'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

async function CasesContent({ searchParams }: { searchParams: SearchParams }) {
  await connection()

  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const status = typeof params.status === 'string' ? params.status : undefined
  const sort = typeof params.sort === 'string' ? params.sort : 'subject'
  const order: 'asc' | 'desc' = params.order === 'desc' ? 'desc' : 'asc'
  let assignee =
    typeof params.assignee === 'string' ? params.assignee : undefined

  // If no assignee filter, default to the current user's coordinator contact_id.
  // resolveOrCreateContactByEmail is called directly here because there is no
  // dedicated API endpoint for "resolve current user to a CiviCRM contact ID" --
  // this is a pre-step to determine a filter value, not a data fetch in its own right.
  // The user can clear this default from CasesFilters without a redirect.
  let defaultAssigneeId: string | undefined
  if (!assignee) {
    const hdrs = await headers()
    const authHeaderName =
      process.env.KEYCLOAK_USER_EMAIL_HEADER ?? 'x-auth-request-email'
    const userEmail =
      process.env.NODE_ENV !== 'production' && process.env.DEV_USER_EMAIL_MOCK
        ? process.env.DEV_USER_EMAIL_MOCK
        : (hdrs.get(authHeaderName) ?? undefined)

    if (userEmail) {
      try {
        const contactId = await resolveOrCreateContactByEmail(userEmail)
        if (contactId) {
          defaultAssigneeId = contactId
          assignee = contactId
        }
      } catch {
        // Non-fatal -- proceed without default filter
      }
    }
  }

  const qs = new URLSearchParams({ page: String(page), sort, order })
  if (status) qs.set('status', status)
  if (assignee) qs.set('assignee', assignee)

  const baseUrl = await getBaseUrl()
  const [data, coordinators] = await Promise.all([
    fetch(`${baseUrl}/api/cases?${qs}`).then(
      (r) => r.json() as Promise<PaginatedResponse<CaseListItem>>
    ),
    fetch(`${baseUrl}/api/coordinators`).then(
      (r) => r.json() as Promise<{ id: string; displayName: string }[]>
    ),
  ])

  console.log('[/cases] listCases result:', JSON.stringify(data, null, 2))
  console.log('[/cases] coordinators:', JSON.stringify(coordinators, null, 2))

  // getActiveView() is a pure synchronous registry lookup -- no I/O, no API call.
  const view = getActiveView()

  return (
    <>
      <CasesFilters
        coordinators={coordinators}
        defaultAssigneeId={defaultAssigneeId}
      />
      <CasesTable
        items={data.items}
        view={view}
        total={data.total}
        page={data.page}
      />
    </>
  )
}

export default function CasesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  return (
    <main className="p-6">
      <Suspense fallback={null}>
        <CasesContent searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
