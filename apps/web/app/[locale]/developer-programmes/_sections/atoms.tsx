import { Fragment } from 'react'
import { Button, ButtonArrowIcon, LogosMark } from '@acid-info/logos-ui'

import { Link } from '@/i18n/navigation'

interface CopyProps {
  children: string
  markSize?: number
  fontSize?: number
}

export function Copy({ children, markSize = 20.64, fontSize = 24 }: CopyProps) {
  const parts = children.split('{mark}')

  return parts.map((part, index) => (
    <Fragment key={index}>
      {index > 0 && (
        <span className="dp-mark">
          <LogosMark
            size={markSize}
            width={`${((markSize / fontSize) * 8) / 11}em`}
            height={`${markSize / fontSize}em`}
            viewBox="0 0 19.1176 26"
            preserveAspectRatio="none"
          />
          <span className="sr-only">Lambda </span>
        </span>
      )}
      {index < parts.length - 1 && part ? (
        <span className="dp-copy-prefix">{part.trimEnd()}</span>
      ) : (
        part.split('—').map((text, dashIndex) => (
          <Fragment key={dashIndex}>
            {dashIndex > 0 && <span className="dp-em-dash">—</span>}
            {text}
          </Fragment>
        ))
      )}
    </Fragment>
  ))
}

export function DesktopLines({ children }: { children: string }) {
  return children.split('\n').map((line, index, lines) => (
    <Fragment key={index}>
      {line}
      {index < lines.length - 1 &&
        (line === '' || lines[index + 1] === '' ? (
          <br />
        ) : (
          <>
            <br className="dp-desktop-break" />
            {!line.endsWith('-') && <span className="dp-reflow-space"> </span>}
          </>
        ))}
    </Fragment>
  ))
}

interface CtaProps {
  link: { label: string; href: string }
  variant?: 'primary' | 'secondary' | 'tertiary'
  inverse?: boolean
}

export function Cta({ link, variant = 'primary', inverse = false }: CtaProps) {
  return (
    <Button
      href={link.href}
      linkAs={Link}
      variant={variant}
      icon={
        <span className="dp-arrow">
          <ButtonArrowIcon />
        </span>
      }
      className={`dp-cta cursor-pointer ${inverse ? 'dp-cta-inverse' : ''}`}
    >
      {link.label}
    </Button>
  )
}
