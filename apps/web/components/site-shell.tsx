import type { ReactNode } from 'react'

import PageTransition from '@/components/page-transition'
import { Providers } from '@/components/providers'
import ScrollToTop from '@/components/scroll-to-top'
import SiteFooter from '@/components/site-footer'
import SiteHeader from '@/components/site-header'
import { ZineChromeGate } from '@/components/sections/zines/zine-chrome-gate'
import SiteHeaderGate from '@/components/site-header/site-header-gate'
import UmamiButtonTracker from '@/components/umami-button-tracker'
import { PodcastPlayerProvider } from '@/app/[locale]/media/_components/podcast-player-context'

interface SiteShellProps {
  children: ReactNode
  locale: string
}

export default function SiteShell({ children, locale }: SiteShellProps) {
  return (
    <Providers>
      <PodcastPlayerProvider>
        <UmamiButtonTracker />
        <ScrollToTop />
        <ZineChromeGate>
          <SiteHeaderGate>
            <SiteHeader locale={locale} />
          </SiteHeaderGate>
        </ZineChromeGate>
        <main className="relative">
          <PageTransition>{children}</PageTransition>
        </main>
        <ZineChromeGate>
          <SiteFooter locale={locale} />
        </ZineChromeGate>
      </PodcastPlayerProvider>
    </Providers>
  )
}
