'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pagination } from '@acid-info/logos-ui'

import type { BuilderHubListingPageSettings } from '@repo/content/schemas'
import type { Idea, Rfp } from '@repo/content/loaders'

import {
  BuildersHubBottomCta,
  BuildersHubListingHeader,
} from '@/components/sections/builders-hub'
import ContentWidth from '@/components/layout/content-width'
import { IdeaCard } from '@/components/sections/builders-hub/idea-card'
import { IdeaRow } from '@/components/sections/builders-hub/idea-row'
import { RfpCard } from '@/components/sections/builders-hub/rfp-card'
import { RfpListRow } from '@/components/sections/builders-hub/rfp-list-row'
import { ROUTES } from '@/constants/routes'

type View = 'grid' | 'list'

type IdeasListingClientProps = {
  kind: 'ideas'
  settings: BuilderHubListingPageSettings
  items: Idea[]
}

type RfpsListingClientProps = {
  kind: 'rfps'
  settings: BuilderHubListingPageSettings
  items: Rfp[]
}

type Props = IdeasListingClientProps | RfpsListingClientProps

const parseView = (raw: string | null, fallback: View): View =>
  raw === 'grid' || raw === 'list' ? raw : fallback

const parsePage = (raw: string | null, totalPages: number): number => {
  const requested = Number.parseInt(raw ?? '1', 10)
  if (Number.isNaN(requested)) return 1
  return Math.min(Math.max(1, requested), totalPages)
}

function getQueryState(defaultView: View, totalPages: number) {
  if (typeof window === 'undefined') {
    return { view: defaultView, page: 1 }
  }
  const params = new URLSearchParams(window.location.search)
  return {
    view: parseView(params.get('view'), defaultView),
    page: parsePage(params.get('page'), totalPages),
  }
}

export function BuildersHubListingClient({ kind, settings, items }: Props) {
  const route = kind === 'ideas' ? ROUTES.ideas : ROUTES.rfps
  const totalPages = Math.max(1, Math.ceil(items.length / settings.pageSize))
  const [view, setView] = useState<View>(settings.defaultView)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const sync = () => {
      const next = getQueryState(settings.defaultView, totalPages)
      setView(next.view)
      setCurrentPage(next.page)
    }
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [settings.defaultView, totalPages])

  const buildHref = (params: { view?: View; page?: number }): string => {
    const next = new URLSearchParams()
    const nextView = params.view ?? view
    if (nextView !== settings.defaultView) next.set('view', nextView)
    const nextPage = params.page ?? currentPage
    if (nextPage > 1) next.set('page', nextPage.toString())
    const query = next.toString()
    return query ? `${route}?${query}` : route
  }

  const updateUrl = (nextView: View, nextPage: number) => {
    window.history.pushState(
      null,
      '',
      buildHref({ view: nextView, page: nextPage })
    )
    setView(nextView)
    setCurrentPage(nextPage)
  }

  const start = (currentPage - 1) * settings.pageSize
  const pageItems = useMemo(
    () => items.slice(start, start + settings.pageSize),
    [items, settings.pageSize, start]
  )

  return (
    <main className="bg-brand-off-white">
      <section
        className={
          kind === 'ideas'
            ? 'bg-brand-off-white md:mb-25 md:min-h-[971px]'
            : 'bg-brand-off-white md:mb-3 md:min-h-[1638px]'
        }
      >
        <div className="mx-auto max-w-360 px-3 pt-10">
          <BuildersHubListingHeader
            title={settings.title}
            description={settings.description}
            submitCta={settings.submitCta}
            view={view}
            onViewChange={(nextView) => updateUrl(nextView, 1)}
            mobileSpacious={kind === 'rfps'}
            backHref={ROUTES.buildersHub}
          />
        </div>

        {view === 'grid' ? (
          <div
            className={
              kind === 'ideas'
                ? 'mx-auto mt-15 max-w-360 px-3'
                : 'mx-auto mt-22.5 max-w-360 px-3 md:mt-34.5'
            }
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {kind === 'ideas'
                ? (pageItems as Idea[]).map((idea) => (
                    <IdeaCard key={idea.slug} idea={idea} />
                  ))
                : (pageItems as Rfp[]).map((rfp) => (
                    <RfpCard key={rfp.slug} rfp={rfp} />
                  ))}
            </div>
          </div>
        ) : (
          <ContentWidth>
            <ul className="mt-0 w-full md:mt-15">
              {kind === 'ideas'
                ? (pageItems as Idea[]).map((idea, i) => (
                    <IdeaRow key={idea.slug} index={start + i + 1} idea={idea} />
                  ))
                : (pageItems as Rfp[]).map((rfp, i) => (
                    <RfpListRow key={rfp.slug} index={start + i + 1} rfp={rfp} />
                  ))}
            </ul>
          </ContentWidth>
        )}

        <div className="mt-12 flex justify-center pb-25">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={(page) => updateUrl(view, page)}
          />
        </div>
      </section>

      {kind === 'ideas' ? (
        <BuildersHubBottomCta
          title={settings.bottomCta.title}
          cta={settings.bottomCta.cta}
        />
      ) : null}
    </main>
  )
}
