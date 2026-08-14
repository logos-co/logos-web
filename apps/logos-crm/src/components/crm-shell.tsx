'use client'

import { LogosMark } from '@acid-info/logos-ui'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useEffect, useRef, type ReactNode } from 'react'

import type { CaseStatus } from '@/contracts/case'
import type { OrganisationRecord, PersonRecord } from '@/contracts/directory'
import { apiClient } from '@/lib/api-client'

export type WorkspaceView =
  | 'dashboard'
  | 'cases'
  | 'people'
  | 'organisations'
  | 'reports'

interface DashboardResponse {
  total: number
  openTotal: number
  byStatus: Record<CaseStatus, number>
}

interface DirectoryResponse<T> {
  items: T[]
}

interface CrmShellProps {
  children: ReactNode
  view: WorkspaceView
}

export function CrmShell({ children, view }: CrmShellProps) {
  const mainRef = useRef<HTMLElement>(null)
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient<DashboardResponse>('/api/v1/dashboard'),
  })
  const peopleQuery = useQuery({
    queryKey: ['people'],
    queryFn: () => apiClient<DirectoryResponse<PersonRecord>>('/api/v1/people'),
  })
  const organisationsQuery = useQuery({
    queryKey: ['organisations'],
    queryFn: () =>
      apiClient<DirectoryResponse<OrganisationRecord>>('/api/v1/organisations'),
  })

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0, behavior: 'auto' })
    mainRef.current?.focus({ preventScroll: true })
  }, [view])

  return (
    <div className="crm-shell">
      <a className="skip-link cursor-pointer" href="#main-content">
        Skip to workspace
      </a>
      <aside className="crm-sidebar">
        <Link
          aria-label="Logos CRM home"
          className="brand-block cursor-pointer"
          href="/"
        >
          <LogosMark size={30} />
          <strong>Logos CRM</strong>
        </Link>

        <nav aria-label="Primary navigation" className="primary-nav">
          <Link
            aria-current={view === 'dashboard' ? 'page' : undefined}
            className={`${view === 'dashboard' ? 'active' : ''} cursor-pointer`}
            href="/"
          >
            Dashboard
          </Link>
          <Link
            aria-current={view === 'cases' ? 'page' : undefined}
            className={`${view === 'cases' ? 'active' : ''} cursor-pointer`}
            href="/cases"
          >
            Cases <span>{dashboardQuery.data?.total ?? '—'}</span>
          </Link>
          <Link
            aria-current={view === 'people' ? 'page' : undefined}
            className={`${view === 'people' ? 'active' : ''} cursor-pointer`}
            href="/people"
          >
            People <span>{peopleQuery.data?.items.length ?? '—'}</span>
          </Link>
          <Link
            aria-current={view === 'organisations' ? 'page' : undefined}
            className={`${view === 'organisations' ? 'active' : ''} cursor-pointer`}
            href="/organisations"
          >
            Organisations{' '}
            <span>{organisationsQuery.data?.items.length ?? '—'}</span>
          </Link>
          <Link
            aria-current={view === 'reports' ? 'page' : undefined}
            className={`${view === 'reports' ? 'active' : ''} cursor-pointer`}
            href="/reports"
          >
            Reports
          </Link>
        </nav>
      </aside>

      <main className="crm-main" id="main-content" ref={mainRef} tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
