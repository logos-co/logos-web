import type { ReactNode } from 'react'

import { LogosMark } from '@acid-info/logos-ui'

import { Button, ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'

type Cta = {
  label: string
  href: string
  external?: boolean
  variant?: 'primary' | 'secondary' | 'tertiary' | 'link'
}

type MetaItem = {
  label: string
  value: ReactNode
}

type Props = {
  /** Where the "← back" link points (parent listing). */
  backHref: string
  backLabel: string
  /** Eyebrow line above the title — e.g. status, breadcrumb, submitter. */
  eyebrow?: string
  title: string
  tagline?: string
  /**
   * Long-form description rendered as paragraphs. Used when the body is plain
   * text (e.g. Ideas). Ignored when `body` is provided.
   */
  description?: string
  /**
   * Pre-rendered body node (e.g. markdown) that replaces the paragraph-split
   * `description`. Used by the RFP detail page to render GitHub markdown.
   */
  body?: ReactNode
  /** Primary CTA button — "Apply" / "Discuss" / etc. */
  primaryCta?: Cta
  /** Optional secondary metadata rendered as label/value pairs. */
  meta?: MetaItem[]
  /** Optional sub-section after meta (e.g. related-items teaser). */
  footer?: ReactNode
}

/**
 * Shared layout for RFP and Idea detail pages. Pure presentation; data
 * shaping happens in each route's `page.tsx`.
 *
 * MVP layout — no Figma source yet. Uses existing design tokens
 * (text-h1 / text-h3-serif / font-mono / brand colors) so it looks at home
 * with the rest of the site. Replace with Figma-driven layout once a design
 * is delivered.
 */
export function BuildersHubDetailLayout({
  backHref,
  backLabel,
  eyebrow,
  title,
  tagline,
  description,
  body,
  primaryCta,
  meta,
  footer,
}: Props) {
  return (
    <main className="bg-brand-off-white">
      {/* Top: back link */}
      <div className="mx-auto max-w-360 px-3 pt-8">
        <Link
          href={backHref}
          className="inline-flex cursor-pointer items-center gap-1 text-brand-dark-green transition-opacity hover:opacity-70"
        >
          <span className="inline-flex size-3.75 shrink-0 rotate-180 items-center justify-center">
            <ButtonArrowIcon />
          </span>
          <span className="font-mono text-[10px] font-medium leading-[1.3] uppercase">
            {backLabel}
          </span>
        </Link>
      </div>

      {/* Header: eyebrow + title + tagline */}
      <header className="mx-auto max-w-360 px-3 pt-10 pb-8">
        <div className="flex items-center gap-3">
          <LogosMark size={28} className="text-brand-dark-green shrink-0" />
          {eyebrow ? (
            <span className="font-mono text-[10px] font-medium leading-[1.3] text-brand-dark-green/70 uppercase">
              {eyebrow}
            </span>
          ) : null}
        </div>
        <h1 className="text-h2 text-brand-dark-green leading-[0.98] tracking-tight mt-6 max-w-[20ch] md:max-w-[18ch]">
          {title}
        </h1>
        {tagline ? (
          <p className="text-h3-serif text-brand-dark-green/80 leading-tight mt-6 max-w-[40ch]">
            {tagline}
          </p>
        ) : null}
      </header>

      {/* Body: description + side meta */}
      <section className="border-t border-brand-dark-green/10">
        <div className="mx-auto max-w-360 px-3 py-12 grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="font-mono text-[10px] font-medium leading-[1.3] text-brand-dark-green/70 uppercase mb-4">
              About
            </h2>
            <div className="font-sans text-[16px] leading-[1.5] text-brand-dark-green space-y-4 max-w-[60ch]">
              {body
                ? body
                : (description ?? '')
                    .split(/\n\s*\n/)
                    .filter(Boolean)
                    .map((para, i) => <p key={i}>{para.trim()}</p>)}
            </div>

            {primaryCta ? (
              <div className="mt-10">
                <Button
                  href={primaryCta.href}
                  variant={primaryCta.variant ?? 'primary'}
                  {...(primaryCta.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  {primaryCta.label}
                </Button>
              </div>
            ) : null}
          </div>

          {meta && meta.length > 0 ? (
            <aside className="md:col-span-1">
              <h2 className="font-mono text-[10px] font-medium leading-[1.3] text-brand-dark-green/70 uppercase mb-4">
                Details
              </h2>
              <dl className="space-y-4">
                {meta.map((item, i) => (
                  <div key={i}>
                    <dt className="font-mono text-[10px] leading-[1.3] text-brand-dark-green/60 uppercase">
                      {item.label}
                    </dt>
                    <dd className="font-sans text-[14px] leading-[1.4] text-brand-dark-green mt-1">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          ) : null}
        </div>
      </section>

      {footer ? (
        <section className="border-t border-brand-dark-green/10">
          <div className="mx-auto max-w-360 px-3 py-12">{footer}</div>
        </section>
      ) : null}
    </main>
  )
}
