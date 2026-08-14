'use client'

import { LogosMark } from '@acid-info/logos-ui'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { SEARCH_MIN_LENGTH } from '@/contracts/search'

import type { CaseStatus } from '@/contracts/case'
import type { OrganisationRecord, PersonRecord } from '@/contracts/directory'
import { apiClient } from '@/lib/api-client'

export type WorkspaceView =
  | 'dashboard'
  | 'cases'
  | 'people'
  | 'organisations'
  | 'reports'
  | 'search'

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
  const router = useRouter()
  const [term, setTerm] = useState('')
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

        <form
          className="global-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            const trimmed = term.trim()
            if (trimmed.length < SEARCH_MIN_LENGTH) return
            router.push(`/search?q=${encodeURIComponent(trimmed)}`)
          }}
        >
          <label className="visually-hidden" htmlFor="global-search-input">
            Search cases, people, and organisations
          </label>
          <input
            id="global-search-input"
            type="search"
            placeholder="Search everything"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
          {/* An explicit control rather than relying on implicit submission,
              which does not fire reliably for a lone search input. */}
          <button
            aria-label="Search"
            className="global-search-submit cursor-pointer"
            disabled={term.trim().length < SEARCH_MIN_LENGTH}
            type="submit"
          >
            Go
          </button>
        </form>

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
