'use client'

import { useId, useState, useSyncExternalStore } from 'react'
import { motion } from 'motion/react'
import { FaqCloseIcon, FaqOpenIcon } from '@acid-info/logos-ui'
import type { NodeReferralProgrammeCopySection } from '@repo/content/schemas'

import { EASE } from '@/lib/motion'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeToMotionPreference(onChange: () => void) {
  const preference = window.matchMedia(REDUCED_MOTION_QUERY)
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

interface FaqAccordionProps {
  items: NodeReferralProgrammeCopySection['faqs']['items']
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const id = useId()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    prefersReducedMotion,
    () => false
  )
  const transition = { duration: reducedMotion ? 0 : 0.28, ease: EASE.out }

  return (
    <article>
      {items.map((item, index) => {
        const isOpen = openIndex === index
        const triggerId = `${id}-question-${index}`
        const panelId = `${id}-answer-${index}`

        return (
          <div
            key={item.question}
            className="border-t border-brand-dark-green/35 last:border-b"
          >
            <h3 className="font-sans text-lg leading-[1.15] tracking-[-0.01em]">
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full cursor-pointer items-center justify-between gap-6 py-[18px] text-left focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                <span className="min-h-6">{item.question}</span>
                {isOpen ? (
                  <FaqCloseIcon className="shrink-0" />
                ) : (
                  <FaqOpenIcon className="shrink-0" />
                )}
              </button>
            </h3>
            <motion.div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              aria-hidden={!isOpen}
              inert={!isOpen}
              initial={false}
              animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
              transition={transition}
              className="overflow-hidden"
            >
              <p className="max-w-[600px] pb-6 font-sans text-sm leading-[1.2] text-brand-dark-green/85">
                {item.answer.map((part, partIndex) =>
                  part.href ? (
                    <a
                      key={partIndex}
                      href={part.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      {part.text}
                    </a>
                  ) : (
                    part.text
                  )
                )}
              </p>
            </motion.div>
          </div>
        )
      })}
    </article>
  )
}
