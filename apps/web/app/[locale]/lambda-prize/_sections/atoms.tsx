import { Fragment } from 'react'
import { Button, ButtonArrowIcon, LogosMark } from '@acid-info/logos-ui'

import { Link } from '@/i18n/navigation'

export interface PageLink {
  label: string
  href: string
}

export function Cta({
  link,
  variant = 'primary',
}: {
  link: PageLink
  variant?: 'primary' | 'secondary' | 'tertiary'
}) {
  return (
    <Button
      href={link.href}
      linkAs={Link}
      variant={variant}
      className="lp-cta cursor-pointer"
      icon={
        <span className="lp-arrow">
          <ButtonArrowIcon />
        </span>
      }
    >
      {link.label}
    </Button>
  )
}

export function Copy({ children }: { children: string }) {
  return children.split('{mark}').map((part, index) => (
    <Fragment key={index}>
      {index > 0 && (
        <span className="lp-inline-mark">
          <LogosMark
            size={10.64}
            width={7.74}
            viewBox="0 0 19.1176 26"
            preserveAspectRatio="none"
          />
          <span className="sr-only">Lambda</span>
        </span>
      )}
      {part}
    </Fragment>
  ))
}

export function Lines({ children }: { children: string }) {
  return children.split('\n').map((line, index, lines) => (
    <Fragment key={index}>
      <Copy>{line}</Copy>
      {index < lines.length - 1 &&
        (line === '' || lines[index + 1] === '' ? (
          <br />
        ) : (
          <>
            <br className="lp-desktop-break" />
            {!line.endsWith('-') && <span className="lp-reflow-space"> </span>}
          </>
        ))}
    </Fragment>
  ))
}

export function SectionMeta({
  copy,
}: {
  copy: { eyebrow: string; body: string; cta: PageLink }
}) {
  return (
    <div className="lp-section-meta">
      <p className="lp-eyebrow">{copy.eyebrow}</p>
      <p className="lp-mono">{copy.body}</p>
      <Cta link={copy.cta} variant="tertiary" />
    </div>
  )
}
