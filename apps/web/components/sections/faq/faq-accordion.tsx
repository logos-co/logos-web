'use client'

import { useState } from 'react'

/**
 * Accordion list of FAQ Q&A pairs.
 *
 * Figma desktop 40009046:22322 (gap-12 between cards, w-464),
 * mobile     40009046:22281 (gap-12 between cards, w-full).
 *
 * Each card: bg-gray-01, rounded-xl, p-3, gap-3 between question + answer.
 * Question  = text-eyebrow (Fira Code Medium uppercase 10px).
 * Answer    = text-mono-s  (Fira Mono Regular 10px).
 * Toggle    = "+" / "-" right-aligned in question row.
 */

export interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  items: ReadonlyArray<FaqItem>
  /** Index of the item open on first render. */
  defaultOpen?: number
}

export function FaqAccordion({ items, defaultOpen = 0 }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number>(defaultOpen)

  return (
    <ul className="flex w-full flex-col items-start gap-3">
      {items.map((item, index) => {
        const isOpen = index === openIndex
        const panelId = `faq-panel-${index}`
        const triggerId = `faq-trigger-${index}`

        return (
          <li key={index} className="w-full">
            <button
              type="button"
              id={triggerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full cursor-pointer flex-col items-start rounded-xl bg-gray-01 p-3 text-left text-brand-dark-green"
            >
              <span className="text-eyebrow flex w-full items-center justify-between">
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 ease-out"
                  style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                >
                  +
                </span>
              </span>
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className="grid w-full transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p
                    className={`text-mono-s w-full pt-3 normal-case transition-opacity duration-300 ease-out ${
                      isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {item.answer}
                  </p>
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
