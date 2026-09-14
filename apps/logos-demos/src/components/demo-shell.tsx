'use client'

import { LogosMark } from '@acid-info/logos-ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'

import { ORGS } from '@/demos/references'
import { DEMOS } from '@/demos/registry'

export function DemoShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const mainRef = useRef<HTMLElement>(null)

  // Moving between demos should behave like a page change, not a scroll
  // position carried over from the previous one.
  useEffect(() => {
    window.scrollTo({ left: 0, top: 0, behavior: 'auto' })
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="demo-shell">
      <a className="skip-link cursor-pointer" href="#main-content">
        Skip to demo
      </a>

      <aside className="demo-sidebar">
        <Link
          aria-label="Logos demos home"
          className="brand-block cursor-pointer"
          href="/"
        >
          <LogosMark size={30} />
          <strong>Logos Demos</strong>
        </Link>

        <nav aria-label="Demos" className="primary-nav">
          <Link
            aria-current={pathname === '/' ? 'page' : undefined}
            className={`${pathname === '/' ? 'active' : ''} cursor-pointer`}
            href="/"
          >
            Overview
          </Link>
          {DEMOS.map((demo) => (
            <Link
              key={demo.href}
              aria-current={pathname === demo.href ? 'page' : undefined}
              className={`${pathname === demo.href ? 'active' : ''} cursor-pointer`}
              href={demo.href}
            >
              {demo.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-orgs">
          <span className="text-label">Sources</span>
          <ul>
            {ORGS.map((org) => (
              <li key={org.href}>
                <a
                  href={org.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  {org.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="demo-main" id="main-content" ref={mainRef} tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
