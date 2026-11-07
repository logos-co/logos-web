import { Fragment } from 'react'
import Image from 'next/image'

import { Copy } from '../../lambda-prize/_sections/atoms'
import type { MediaRef } from '@repo/content/schemas'

import { Button, ButtonArrowIcon } from '@/components/ui/button'

export interface PageLink {
  label: string
  href: string
}
export type { RfpProgrammeCopySection as RfpCopy } from '@repo/content/schemas'

export function Lines({ children }: { children: string }) {
  return children.split('\n').map((line, index) => (
    <Fragment key={index}>
      {index > 0 && (
        <>
          <br className="rfp-desktop-break" />
          <span className="rfp-reflow-space"> </span>
        </>
      )}
      <Copy>{line}</Copy>
    </Fragment>
  ))
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
      variant={variant}
      icon={
        <span className="rfp-arrow">
          <ButtonArrowIcon />
        </span>
      }
      className="rfp-cta cursor-pointer"
    >
      {link.label}
    </Button>
  )
}

export function Photo({
  image,
  priority = false,
}: {
  image: MediaRef
  priority?: boolean
}) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes="(max-width: 767px) 100vw, 50vw"
      priority={priority}
      className="rfp-image"
    />
  )
}

export function Tag({
  children,
  outline = false,
}: {
  children: React.ReactNode
  outline?: boolean
}) {
  return (
    <span className={`rfp-tag rfp-mono${outline ? ' rfp-tag-outline' : ''}`}>
      {children}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  kicker,
  heading,
  body,
}: {
  eyebrow: string
  kicker?: string
  heading: string
  body?: string
}) {
  return (
    <div className="rfp-section-heading">
      <p className="rfp-eyebrow">{eyebrow}</p>
      {kicker && <p className="rfp-mono rfp-kicker">{kicker}</p>}
      <h2>
        <Lines>{heading}</Lines>
      </h2>
      {body && (
        <p className="rfp-section-body">
          <Lines>{body}</Lines>
        </p>
      )}
    </div>
  )
}
