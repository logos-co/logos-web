import type { ReactNode } from 'react'

import ContentWidth from '@/components/layout/content-width'

import { DocsToc, type DocsTocKey } from './docs-toc'

/**
 * Layout shell shared by FAQ, Terms, Privacy, Security and any future
 * docs / legal pages: the left ToC + the right content column.
 *
 * Figma desktop 40009046:22318 — flex row, px-12, gap-488, both columns py-80,
 *   ToC w-226 (sticky), content w-464.
 * Figma mobile  40009046:22277 — flex column, px-12, gap-12, ToC py-80,
 *   content pb-80, both w-full.
 *
 * Row layout requires ≥ 1202 px (226 + 488 + 464 + 24) so the breakpoint
 * is xl (1280 px) — below that we render the same stacked layout as mobile.
 */

interface DocsPageShellProps {
  activeKey: DocsTocKey
  children: ReactNode
}

export function DocsPageShell({ activeKey, children }: DocsPageShellProps) {
  return (
    <ContentWidth>
      <section className="flex min-h-190 flex-col items-start gap-3 px-3 xl:flex-row xl:gap-122">
        <DocsToc activeKey={activeKey} />
        <div className="flex w-full flex-col items-start gap-6 pb-20 xl:w-116 xl:py-20">
          {children}
        </div>
      </section>
    </ContentWidth>
  )
}
