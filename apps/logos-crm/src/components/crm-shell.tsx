'use client'

import { CircleArrowIcon, LogosMark } from '@acid-info/logos-ui'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { SEARCH_MIN_LENGTH } from '@/contracts/search'

import type { CaseStatus } from '@/contracts/case'
import type { OrganisationRecord, PersonRecord } from '@/contracts/directory'
import type { CurrentActor } from '@/contracts/user'
import { apiClient } from '@/lib/api-client'

export type WorkspaceView =
  | 'dashboard'
  | 'cases'
  | 'people'
  | 'organisations'
  | 'reports'
  | 'scout'
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

/**
 * Remembered per browser rather than per session: somebody who works with the
 * sidebar closed wants it closed tomorrow too.
 */
const SIDEBAR_STORAGE_KEY = 'logos-crm.sidebar-collapsed'

export function CrmShell({ children, view }: CrmShellProps) {
  const mainRef = useRef<HTMLElement>(null)
  const router = useRouter()
  const [term, setTerm] = useState('')
  /**
   * Starts expanded on the server and on the first client render, then reads
   * the stored preference. Reading storage during render would make the markup
   * disagree with the server's and hydrate into a flash of the wrong layout.
   */
  const [isCollapsed, setIsCollapsed] = useState(false)
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
  // Asked at request time rather than read from the build: these pages are
  // prerendered, so a build-time answer would keep claiming whatever was true
  // when the bundle was made.
  const actorQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient<{ item: CurrentActor }>('/api/v1/me'),
  })

  useEffect(() => {
    setIsCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true')
  }, [])

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0, behavior: 'auto' })
    mainRef.current?.focus({ preventScroll: true })
  }, [view])

  function toggleSidebar(): void {
    setIsCollapsed((collapsed) => {
      const next = !collapsed
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <div className="crm-shell" data-collapsed={isCollapsed ? 'true' : 'false'}>
      <a className="skip-link cursor-pointer" href="#main-content">
        Skip to workspace
      </a>
      <aside className="crm-sidebar" id="crm-sidebar">
        <button
          aria-controls="crm-sidebar"
          aria-expanded={!isCollapsed}
          className="sidebar-toggle cursor-pointer"
          type="button"
          onClick={toggleSidebar}
        >
          <CircleArrowIcon direction={isCollapsed ? 'right' : 'left'} size={22} />
          <span className="visually-hidden">
            {isCollapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
          </span>
        </button>

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
            placeholder="Search"
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
            Cases <span>{dashboardQuery.data?.total ?? '-'}</span>
          </Link>
          <Link
            aria-current={view === 'people' ? 'page' : undefined}
            className={`${view === 'people' ? 'active' : ''} cursor-pointer`}
            href="/people"
          >
            People <span>{peopleQuery.data?.items.length ?? '-'}</span>
          </Link>
          <Link
            aria-current={view === 'organisations' ? 'page' : undefined}
            className={`${view === 'organisations' ? 'active' : ''} cursor-pointer`}
            href="/organisations"
          >
            Organisations{' '}
            <span>{organisationsQuery.data?.items.length ?? '-'}</span>
          </Link>
          <Link
            aria-current={view === 'scout' ? 'page' : undefined}
            className={`${view === 'scout' ? 'active' : ''} cursor-pointer`}
            href="/scout"
          >
            Scout
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

      {/* An instance anyone can open without signing in has to say so, or the
          seeded records read as a real caseload. */}
      {actorQuery.data?.item.authMode === 'demo' ? (
        <p className="demo-badge">
          Demo instance: seeded data, no sign-in. Never enter a real
          person&rsquo;s details.
        </p>
      ) : null}
    </div>
  )
}
