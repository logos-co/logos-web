'use client'

import { LogosMark } from '@acid-info/logos-ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'

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
              {demo.label} <span>{demo.stack}</span>
            </Link>
          ))}
        </nav>

        <p className="sidebar-note">
          Every demo runs the protocol in your browser. There is no backend.
        </p>
      </aside>

      <main className="demo-main" id="main-content" ref={mainRef} tabIndex={-1}>
        {children}
      </main>
    </div>
  )
}
