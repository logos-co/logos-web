import { Suspense } from 'react'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { getBaseUrl } from '@/lib/server-url'
import { getActiveView } from '@/lib/views'
import CaseDetailShell from '@/components/cases/CaseDetailShell'
import type { CaseDetail, PaginatedResponse } from '@/types/case'
import type { CiviActivity } from '@/lib/civicrm/types'

async function CaseDetailContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection()

  const { id } = await params
  const baseUrl = await getBaseUrl()

  // Fetch case detail and first activity page in parallel to avoid a waterfall.
  const [caseRes, activitiesRes] = await Promise.all([
    fetch(`${baseUrl}/api/cases/${id}`),
    fetch(`${baseUrl}/api/cases/${id}/activities?page=1`),
  ])

  if (caseRes.status === 404) {
    console.error(`[/cases/${id}] API returned 404`)
    notFound()
  }
  if (!caseRes.ok) {
    throw new Error(`GET /api/cases/${id} failed: ${caseRes.status}`)
  }
  if (!activitiesRes.ok) {
    throw new Error(
      `GET /api/cases/${id}/activities failed: ${activitiesRes.status}`
    )
  }

  const [caseDetail, initialActivities] = await Promise.all([
    caseRes.json() as Promise<CaseDetail>,
    activitiesRes.json() as Promise<PaginatedResponse<CiviActivity>>,
  ])

  console.log(`[/cases/${id}] caseDetail:`, JSON.stringify(caseDetail, null, 2))
  console.log(
    `[/cases/${id}] initialActivities:`,
    JSON.stringify(initialActivities, null, 2)
  )

  // getActiveView() is a pure synchronous registry lookup -- no I/O, no API call.
  const view = getActiveView()

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold">{caseDetail.subject}</h1>
      <CaseDetailShell
        caseDetail={caseDetail}
        initialActivities={initialActivities}
        view={view}
      />
    </>
  )
}

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <main className="p-6">
      <Suspense fallback={null}>
        <CaseDetailContent params={params} />
      </Suspense>
    </main>
  )
}
