import type { ReactNode } from 'react'

import PageTransition from '@/components/page-transition'
import { Providers } from '@/components/providers'
import ScrollToTop from '@/components/scroll-to-top'
import SiteFooter from '@/components/site-footer'
import SiteHeader from '@/components/site-header'
import SiteHeaderGate from '@/components/site-header/site-header-gate'
import UmamiButtonTracker from '@/components/umami-button-tracker'

interface SiteShellProps {
  children: ReactNode
  locale: string
}

export default function SiteShell({ children, locale }: SiteShellProps) {
  return (
    <Providers>
      <UmamiButtonTracker />
      <ScrollToTop />
      <SiteHeaderGate>
        <SiteHeader locale={locale} />
      </SiteHeaderGate>
      <main className="relative">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter locale={locale} />
    </Providers>
  )
}
