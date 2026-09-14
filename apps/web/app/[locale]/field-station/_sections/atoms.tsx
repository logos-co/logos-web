import type { ReactNode } from 'react'

import type { TrackBlock } from '../_content'

type TextLink = NonNullable<TrackBlock['link']>

/** The H3 Sans section title the Figma frame uses above most blocks. */
export function SectionHeading({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h2 className={`text-h3-sans text-brand-dark-green ${className ?? ''}`}>
      {children}
    </h2>
  )
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Copy with linked phrases, matched as whole words in order. A phrase stays
 * plain text until its `href` is set, so links waiting on the team never
 * point anywhere.
 */
export function LinkedText({
  text,
  link,
}: {
  text: string
  link?: TextLink | readonly TextLink[]
}) {
  const links = link === undefined ? [] : 'label' in link ? [link] : link
  const parts: ReactNode[] = []
  let cursor = 0
  let emitted = 0

  for (const item of links) {
    const match = new RegExp(`\\b${escapeRegExp(item.label)}\\b`).exec(
      text.slice(cursor)
    )
    if (!match) continue

    const start = cursor + match.index
    cursor = start + item.label.length
    if (!item.href) continue

    parts.push(
      text.slice(emitted, start),
      <a
        key={start}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        data-umami-event-name={item.eventName}
        className="cursor-pointer underline underline-offset-2"
      >
        {item.label}
      </a>
    )
    emitted = cursor
  }
  parts.push(text.slice(emitted))

  return <>{parts}</>
}
