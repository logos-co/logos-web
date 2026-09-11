'use client'

import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { type ReactNode, useState } from 'react'

import { EASE } from '@/lib/motion'

export interface AccordionFactLink {
  label: string
  href: string
}

/**
 * An item without `body`, `facts` or `image` renders as a static row: there is
 * nothing to expand, so it gets no toggle button.
 */
export interface AccordionItem {
  key: string
  title: string
  subtitle?: string
  body?: string
  facts?: string[]
  factLinks?: Partial<Record<number, AccordionFactLink>>
  image?: string
  imageClassName?: string
  /** Stable Umami event name for the toggle; defaults to the visible label. */
  eventName?: string
  /** Appended to the subtitle slot for this row only. */
  subtitleClassName?: string
}

function hasPanel(item: AccordionItem): boolean {
  return Boolean(item.body || item.facts?.length || item.image)
}

function FactText({ fact, link }: { fact: string; link?: AccordionFactLink }) {
  if (!link || !fact.includes(link.label)) {
    return <>{fact}</>
  }

  const [before, after] = fact.split(link.label)

  return (
    <>
      {before}
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer underline decoration-current underline-offset-2"
      >
        {link.label}
      </a>
      {after}
    </>
  )
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`shrink-0 transition-transform duration-300 ease-out ${
        open ? 'rotate-180' : ''
      }`}
    >
      <path
        d="M6 9.5L12 15.5L18 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const DEFAULT_CLASS_NAMES = {
  root: 'flex w-full flex-col',
  item: 'border-t border-brand-off-white/25 last:border-b',
  row: 'flex w-full items-center justify-between gap-6 py-[30px] text-left',
  title:
    'font-display text-[30px] leading-none tracking-[-0.9px] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] lg:text-[56px] lg:tracking-[-0.03em]',
  aside: 'flex items-center gap-3 lg:gap-[42px]',
  subtitle:
    'hidden font-mono text-[14px] tracking-[-0.03em] text-brand-off-white/90 sm:inline lg:text-[20px]',
  panel:
    'flex flex-col gap-8 pb-10 lg:flex-row lg:items-start lg:justify-between lg:gap-12 lg:pb-[60px]',
  body: 'font-sans text-[14px] leading-[1.2]',
}

/**
 * Each slot replaces the default classes outright rather than merging with
 * them, so a caller restyling a slot passes its full class list.
 */
export type AccordionClassNames = Partial<typeof DEFAULT_CLASS_NAMES>

interface CivilSocietyAccordionProps {
  items: AccordionItem[]
  classNames?: AccordionClassNames
  /** Replaces the rotating chevron with one element per state. */
  icons?: { open: ReactNode; closed: ReactNode }
}

export default function CivilSocietyAccordion({
  items,
  classNames,
  icons,
}: CivilSocietyAccordionProps) {
  const [openKey, setOpenKey] = useState<AccordionItem['key'] | null>(
    () => items.find(hasPanel)?.key ?? null
  )
  const slots = { ...DEFAULT_CLASS_NAMES, ...classNames }

  return (
    <div className={slots.root}>
      {items.map((item) => {
        const isExpandable = hasPanel(item)
        const isOpen = isExpandable && item.key === openKey
        const panelId = `civil-society-panel-${item.key}`
        const rowContent = (
          <>
            <span className={slots.title}>{item.title}</span>
            <span className={slots.aside}>
              {item.subtitle ? (
                <span
                  className={
                    item.subtitleClassName
                      ? `${slots.subtitle} ${item.subtitleClassName}`
                      : slots.subtitle
                  }
                >
                  {item.subtitle}
                </span>
              ) : null}
              {icons ? (
                isOpen ? (
                  icons.open
                ) : (
                  icons.closed
                )
              ) : (
                <ChevronDown open={isOpen} />
              )}
            </span>
          </>
        )

        return (
          <div key={item.key} className={slots.item}>
            {isExpandable ? (
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                data-umami-event-name={item.eventName}
                onClick={() => setOpenKey(isOpen ? null : item.key)}
                className={`${slots.row} cursor-pointer transition-opacity hover:opacity-80`}
              >
                {rowContent}
              </button>
            ) : (
              <div className={slots.row}>{rowContent}</div>
            )}

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  id={panelId}
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE.inOut }}
                  className="overflow-hidden"
                >
                  <div className={slots.panel}>
                    <div className="flex max-w-[572px] flex-col gap-6 lg:gap-[30px]">
                      {item.body ? (
                        <p className={slots.body}>{item.body}</p>
                      ) : null}
                      {item.facts?.length ? (
                        <div className="flex flex-col gap-4 font-mono text-xs leading-[1.3] lg:gap-[20px]">
                          {item.facts.map((fact, index) => (
                            <p key={fact}>
                              <FactText
                                fact={fact}
                                link={item.factLinks?.[index]}
                              />
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {item.image ? (
                      <div className="relative h-[180px] w-full shrink-0 overflow-hidden rounded-[20px] lg:h-[199px] lg:w-[401px]">
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          sizes="(max-width: 1023px) calc(100vw - 48px), 401px"
                          className={`object-cover ${item.imageClassName ?? ''}`}
                        />
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
