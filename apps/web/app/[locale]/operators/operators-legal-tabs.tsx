'use client'

import { useState } from 'react'

import { LegalMarkdown } from '@/components/sections/shared/legal-markdown'

type OperatorsLegalTabKey = 'terms' | 'privacy'

interface OperatorsLegalDocument {
  label: string
  body: string
}

interface OperatorsLegalTabsProps {
  terms: OperatorsLegalDocument
  privacy: OperatorsLegalDocument
}

const tabs: ReadonlyArray<{
  key: OperatorsLegalTabKey
  panelId: string
}> = [
  { key: 'terms', panelId: 'operators-terms-panel' },
  { key: 'privacy', panelId: 'operators-privacy-panel' },
]

export function OperatorsLegalTabs({
  privacy,
  terms,
}: OperatorsLegalTabsProps) {
  const [activeTab, setActiveTab] = useState<OperatorsLegalTabKey>('terms')

  const documents: Record<OperatorsLegalTabKey, OperatorsLegalDocument> = {
    terms,
    privacy,
  }
  const activeDocument = documents[activeTab]
  const activePanelId =
    tabs.find((tab) => tab.key === activeTab)?.panelId ?? tabs[0]!.panelId

  return (
    <section className="border-t border-brand-dark-green/15 bg-brand-off-white px-3 py-10 md:py-16">
      <div className="mx-auto flex w-full max-w-[1020px] flex-col gap-8">
        <div
          role="tablist"
          aria-label="Operators legal documents"
          className="flex flex-wrap gap-2 border-b border-brand-dark-green/15"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            const document = documents[tab.key]

            return (
              <button
                key={tab.key}
                id={`${tab.key}-tab`}
                type="button"
                role="tab"
                aria-controls={tab.panelId}
                aria-selected={isActive}
                className={`text-eyebrow cursor-pointer border-b px-0 py-3 transition-opacity hover:opacity-70 ${
                  isActive
                    ? 'border-brand-dark-green text-brand-dark-green'
                    : 'border-transparent text-brand-dark-green/55'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {document.label}
              </button>
            )
          })}
        </div>

        <div
          id={activePanelId}
          role="tabpanel"
          aria-labelledby={`${activeTab}-tab`}
          className="max-w-[960px]"
        >
          <LegalMarkdown
            body={activeDocument.body}
            className="gap-5 font-mono text-[16px] leading-[1.75] md:text-[18px]"
          />
        </div>
      </div>
    </section>
  )
}
