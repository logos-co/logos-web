/**
 * Shared presentational atoms and helpers for the Basecamp page sections.
 */
import type { CTA } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import { Button } from '@/components/ui'
import { resolveBasecampInstallCtaLinkProps } from '@/lib/basecamp-release-links'

export function getButtonIcon(iconOverride?: string) {
  if (iconOverride === 'download') {
    return <IconMask src="/icons/download.svg" className="size-[15px]" />
  }
  if (iconOverride === 'none') {
    return false
  }
  return undefined
}

export function paragraphs(value?: string) {
  if (!value) return []
  return value.split('\n\n').filter(Boolean)
}

export function BodyDetailBlock({ text }: { text: string }) {
  const lines = text.split('\n').filter(Boolean)

  if (lines.length <= 1) {
    return <p className="whitespace-pre-line">{text}</p>
  }

  return (
    <div className="flex flex-col">
      {lines.map((line) => (
        <p key={line} className="font-semibold uppercase">
          {line}
        </p>
      ))}
    </div>
  )
}

export function BasecampCta({
  cta,
  className,
}: {
  cta: CTA
  className?: string
}) {
  return (
    <Button
      {...resolveBasecampInstallCtaLinkProps(cta)}
      variant={cta.variant ?? 'secondary'}
      icon={getButtonIcon(cta.iconOverride)}
      className={className}
    >
      {cta.label}
    </Button>
  )
}
