'use client'

import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useState } from 'react'

import { EASE } from '@/lib/motion'

export interface AccordionFactLink {
  label: string
  href: string
}

export interface AccordionItem {
  key: 'debt' | 'surveillance' | 'corruption' | 'stagnation'
  title: string
  subtitle: string
  body: string
  facts: string[]
  factLinks: Partial<Record<number, AccordionFactLink>>
  image: string
  imageClassName?: string
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

export default function CivilSocietyAccordion({
  items,
}: {
  items: AccordionItem[]
}) {
  const [openKey, setOpenKey] = useState<AccordionItem['key'] | null>(
    () => items[0]?.key ?? null,
  )

  return (
    <div className="flex w-full flex-col">
      {items.map((item) => {
        const isOpen = item.key === openKey
        const panelId = `civil-society-panel-${item.key}`

        return (
          <div
            key={item.key}
            className="border-t border-brand-off-white/25 last:border-b"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenKey(isOpen ? null : item.key)}
              className="flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left transition-opacity hover:opacity-80 lg:py-[30px]"
            >
              <span className="text-h2">{item.title}</span>
              <span className="flex items-center gap-3 lg:gap-[42px]">
                <span className="hidden font-mono text-[14px] tracking-[-0.03em] text-brand-off-white/90 sm:inline lg:text-[20px]">
                  {item.subtitle}
                </span>
                <ChevronDown open={isOpen} />
              </span>
            </button>

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
                  <div className="flex flex-col gap-8 pb-10 lg:flex-row lg:items-start lg:justify-between lg:gap-12 lg:pb-[60px]">
                    <div className="flex max-w-[572px] flex-col gap-6 lg:gap-[30px]">
                      <p className="font-sans text-[14px] leading-[1.2]">
                        {item.body}
                      </p>
                      <div className="flex flex-col gap-4 font-mono text-[10px] leading-[1.3] lg:gap-[20px]">
                        {item.facts.map((fact, index) => (
                          <p key={fact}>
                            <FactText fact={fact} link={item.factLinks[index]} />
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="relative h-[180px] w-full shrink-0 overflow-hidden rounded-[20px] lg:h-[199px] lg:w-[401px]">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="(max-width: 1023px) calc(100vw - 48px), 401px"
                        className={`object-cover ${item.imageClassName ?? ''}`}
                      />
                    </div>
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
