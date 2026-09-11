import type { ReactNode } from 'react'

import type { TrackBlock } from '../_content'

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

/**
 * Copy with one linked phrase. The phrase stays plain text until its `href`
 * is set, so links waiting on the team never point anywhere.
 */
export function LinkedText({
  text,
  link,
}: {
  text: string
  link?: TrackBlock['link']
}) {
  const at = link?.href ? text.lastIndexOf(link.label) : -1
  if (!link?.href || at < 0) {
    return <>{text}</>
  }

  return (
    <>
      {text.slice(0, at)}
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        data-umami-event-name={link.eventName}
        className="cursor-pointer underline underline-offset-2"
      >
        {link.label}
      </a>
      {text.slice(at + link.label.length)}
    </>
  )
}
