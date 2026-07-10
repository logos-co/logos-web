'use client'

import { useEffect, useMemo, useState } from 'react'

import type { BlogTocItem } from '@/lib/blog-content'
import { cn } from '@/lib/cn'

interface ArticleSidebarProps {
  contentsLabel: string
  title: string
  toc: BlogTocItem[]
}

interface SidebarItem extends BlogTocItem {
  id: string
}

function normaliseItems(title: string, toc: BlogTocItem[]): SidebarItem[] {
  const hasTitle = toc.some((item) => item.level === 0)
  const items = hasTitle
    ? toc
    : [
        {
          level: 0,
          tag: 'h1',
          href: '#title-anchor',
          title,
          blockIndex: -1,
        },
        ...toc,
      ]

  return items.map((item) => {
    const href = item.level === 0 ? '#title-anchor' : item.href
    return {
      ...item,
      href,
      id: href.replace(/^#/, ''),
    }
  })
}

export function ArticleSidebar({
  contentsLabel,
  title,
  toc,
}: ArticleSidebarProps) {
  const items = useMemo(() => normaliseItems(title, toc), [title, toc])
  const [activeId, setActiveId] = useState(items[0]?.id ?? '')

  useEffect(() => {
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target instanceof HTMLElement) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '0px 0px -80% 0px' }
    )

    elements.forEach((element) => observer.observe(element))

    const handleHashChange = () => {
      const id = window.location.hash.replace(/^#/, '')
      setActiveId(id || items[0]?.id || '')
    }
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      observer.disconnect()
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [items])

  if (items.length === 0) return null

  return (
    <aside className="hidden md:col-span-4 md:block lg:col-span-3">
      <div className="sticky top-[95px] flex max-h-[calc(100vh-134px)] flex-col pb-[72px] text-brand-dark-green">
        <p className="mb-6 font-sans text-[12px] leading-4">{contentsLabel}</p>
        <nav
          aria-label={contentsLabel}
          className="overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, index) => {
            const isActive = item.id === activeId
            return (
              <a
                key={`${item.href}-${index}`}
                href={item.href}
                aria-current={isActive ? 'location' : undefined}
                onClick={() => setActiveId(item.id)}
                className={cn(
                  'flex cursor-pointer border-l px-4 py-1 font-sans text-[12px] leading-4 no-underline transition-colors hover:bg-brand-dark-green/10',
                  item.level >= 3 && 'pl-8',
                  isActive ? 'border-brand-dark-green' : 'border-transparent'
                )}
              >
                {item.title}
              </a>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
