import { Suspense } from 'react'

import { ChainExplorer } from '@/components/chain-explorer'
import { LearnMoreButton } from '@/components/learn-more-button'
import { readExplainer } from '@/demos/explainer'
import { findDemo } from '@/demos/registry'

const DEMO_HREF = '/blockchain'

export default function Page() {
  const demo = findDemo(DEMO_HREF)
  if (!demo) throw new Error(`No demo registered for ${DEMO_HREF}`)

  const explainer = readExplainer('blockchain')

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 md:py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-eyebrow text-gray-05">Demo · {demo.stack}</p>
          <h1 className="text-h3-sans text-brand-dark-green">{demo.label}</h1>
        </div>
        <LearnMoreButton body={explainer} title="How this works" />
      </header>

      {/* ChainExplorer reads the query from the URL, which needs a boundary
          while the page is prerendered. */}
      <Suspense fallback={null}>
        <ChainExplorer />
      </Suspense>
    </div>
  )
}
