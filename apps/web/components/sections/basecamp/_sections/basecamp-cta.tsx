import type { CTA } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import { BasecampDownloadButton } from '@/components/sections/shared/basecamp-download-cta'

function getButtonIcon(iconOverride?: string) {
  if (iconOverride === 'download') {
    return <IconMask src="/icons/download.svg" className="size-[15px]" />
  }
  if (iconOverride === 'none') {
    return false
  }
  return undefined
}

export function BasecampCta({
  cta,
  className,
  eventName,
}: {
  cta: CTA
  className?: string
  /** Stable Umami event name; the tracker falls back to the label. */
  eventName?: string
}) {
  return (
    <BasecampDownloadButton
      cta={cta}
      icon={getButtonIcon(cta.iconOverride)}
      className={className}
      eventName={eventName}
    />
  )
}
