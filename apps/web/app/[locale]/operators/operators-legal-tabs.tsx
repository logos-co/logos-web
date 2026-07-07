'use client'

import { useState } from 'react'

import { LegalMarkdown } from '@/components/sections/shared/legal-markdown'

type OperatorsLegalDocumentKey = 'terms' | 'privacy'

interface OperatorsLegalDocument {
  label: string
  body: string
}

interface OperatorsLegalTabsProps {
  terms: OperatorsLegalDocument
  privacy: OperatorsLegalDocument
}

const documentButtons: ReadonlyArray<{
  key: OperatorsLegalDocumentKey
  panelId: string
}> = [
  { key: 'terms', panelId: 'operators-terms-panel' },
  { key: 'privacy', panelId: 'operators-privacy-panel' },
]

export function OperatorsLegalTabs({
  privacy,
  terms,
}: OperatorsLegalTabsProps) {
  const [activeDocumentKey, setActiveDocumentKey] =
    useState<OperatorsLegalDocumentKey | null>(null)

  const documents: Record<OperatorsLegalDocumentKey, OperatorsLegalDocument> = {
    terms,
    privacy,
  }
  const activeDocument =
    activeDocumentKey === null ? null : documents[activeDocumentKey]
  const activePanelId =
    documentButtons.find((button) => button.key === activeDocumentKey)
      ?.panelId ?? documentButtons[0]!.panelId

  return (
    <section className="border-t border-brand-dark-green/15 bg-brand-off-white px-3 py-10 md:py-16">
      <div className="mx-auto flex w-full max-w-[1020px] flex-col gap-8">
        <div
          aria-label="Operators legal documents"
          className="flex flex-wrap gap-6 border-b border-brand-dark-green/15 md:gap-8"
        >
          {documentButtons.map((button) => {
            const isActive = activeDocumentKey === button.key
            const document = documents[button.key]

            return (
              <button
                key={button.key}
                type="button"
                aria-controls={button.panelId}
                aria-expanded={isActive}
                className={`cursor-pointer border-b px-0 py-3 font-mono text-[13px] leading-[1.7] uppercase transition-opacity hover:opacity-70 md:text-[14px] ${
                  isActive
                    ? 'border-brand-dark-green text-brand-dark-green'
                    : 'border-transparent text-brand-dark-green/55'
                }`}
                onClick={() => setActiveDocumentKey(button.key)}
              >
                {document.label}
              </button>
            )
          })}
        </div>

        {activeDocument && (
          <div id={activePanelId} className="max-w-[960px]">
            <LegalMarkdown
              body={activeDocument.body}
              className="gap-5 font-mono text-[13px] leading-[1.7] md:text-[14px] [&_h1]:text-[22px] [&_h1]:leading-[1.1] [&_h1]:md:text-[26px] [&_h2]:text-[20px] [&_h2]:leading-[1.15] [&_h2]:md:text-[22px]"
            />
          </div>
        )}
      </div>
    </section>
  )
}
