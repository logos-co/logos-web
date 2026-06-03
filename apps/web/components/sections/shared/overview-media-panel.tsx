import type { ReactNode } from 'react'

import { SectionMarker } from '@acid-info/logos-ui'
import type { CTA } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import { Button, type ButtonVariant } from '@/components/ui'
import { resolveBasecampInstallCtaLinkProps } from '@/lib/basecamp-release-links'

type PanelTone = 'gray-01' | 'gray-02'
type PanelSize = 'large' | 'compact'
type ImagePosition = 'left' | 'right'

interface OverviewMediaPanelProps {
  eyebrow?: string
  mobileEyebrow?: string
  footerLabel?: string
  title: string
  mobileTitle?: string
  body?: ReadonlyArray<string>
  mobileBody?: ReadonlyArray<string>
  cta?: CTA
  secondaryCta?: CTA
  image: ReactNode
  imagePosition?: ImagePosition
  size?: PanelSize
  tone?: PanelTone
  primaryCtaDefaultVariant?: ButtonVariant
  className?: string
  copyClassName?: string
  copyBodyClassName?: string
  actionsClassName?: string
}

function getButtonIcon(iconOverride?: string) {
  if (iconOverride === 'external') {
    return <IconMask src="/icons/external-link.svg" className="size-3.75" />
  }
  if (iconOverride === 'download') {
    return <IconMask src="/icons/download.svg" className="size-[15px]" />
  }
  if (iconOverride === 'none') {
    return false
  }
  return undefined
}

function ctaAttrs(external?: boolean) {
  return external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

function OverviewMediaPanelActions({
  cta,
  secondaryCta,
  primaryCtaDefaultVariant,
  className,
}: {
  cta?: CTA
  secondaryCta?: CTA
  primaryCtaDefaultVariant: ButtonVariant
  className?: string
}) {
  if (!cta && !secondaryCta) {
    return null
  }

  return (
    <div className={`flex items-baseline gap-1.5${className ? ` ${className}` : ''}`}>
      {cta ? (
        <Button
          {...resolveBasecampInstallCtaLinkProps(cta)}
          variant={cta.variant ?? primaryCtaDefaultVariant}
          icon={getButtonIcon(cta.iconOverride)}
          className="cursor-pointer"
          {...ctaAttrs(cta.external)}
        >
          {cta.label}
        </Button>
      ) : null}
      {secondaryCta ? (
        <Button
          {...resolveBasecampInstallCtaLinkProps(secondaryCta)}
          variant={secondaryCta.variant ?? 'secondary'}
          icon={getButtonIcon(secondaryCta.iconOverride)}
          className="cursor-pointer"
          {...ctaAttrs(secondaryCta.external)}
        >
          {secondaryCta.label}
        </Button>
      ) : null}
    </div>
  )
}

export function OverviewMediaPanel({
  eyebrow,
  mobileEyebrow,
  footerLabel,
  title,
  mobileTitle,
  body = [],
  mobileBody,
  cta,
  secondaryCta,
  image,
  imagePosition = 'right',
  size = 'large',
  tone = 'gray-01',
  primaryCtaDefaultVariant = 'primary',
  className,
  copyClassName,
  copyBodyClassName,
  actionsClassName,
}: OverviewMediaPanelProps) {
  const isCompact = size === 'compact'
  const backgroundClass = tone === 'gray-02' ? 'bg-gray-02' : 'bg-gray-01'
  const heightClass = isCompact
    ? 'md:h-[335px]'
    : 'md:h-[357px] md:min-h-[357px]'
  const markerClass = isCompact ? 'md:h-[98px]' : undefined
  const resolvedMobileEyebrow = mobileEyebrow ?? eyebrow
  const hasMobileTitle = mobileTitle !== undefined
  const hasMobileBody = mobileBody !== undefined
  const footerMarker = footerLabel ?? (isCompact ? eyebrow : undefined)

  const copyBody = (
    <div className={`flex w-full min-w-0 flex-col gap-3 break-words${copyBodyClassName ? ` ${copyBodyClassName}` : ''}`}>
      <h2 className="text-h4-sans md:w-[377px]">
        {hasMobileTitle ? (
          <>
            <span className="md:hidden">{mobileTitle}</span>
            <span className="hidden md:inline">{title}</span>
          </>
        ) : (
          title
        )}
      </h2>
      {mobileBody !== undefined && mobileBody.length > 0 ? (
        <div className="flex max-w-full flex-col gap-3 text-[12px] leading-[1.2] font-medium text-brand-dark-green md:hidden">
          {mobileBody.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      {body.length > 0 ? (
        <div
          className={`max-w-full flex-col gap-3 text-[12px] leading-[1.2] font-medium text-brand-dark-green md:w-[485px] ${
            hasMobileBody ? 'hidden md:flex' : 'flex'
          }`}
        >
          {body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}
    </div>
  )

  const copyPanel = (
    <div
      className={`flex min-h-72 flex-col justify-between gap-6 text-brand-dark-green md:h-full md:w-full ${
        isCompact ? 'md:pb-3' : ''
      } ${copyClassName ?? ''}`}
    >
      {resolvedMobileEyebrow ? (
        <SectionMarker
          label={resolvedMobileEyebrow}
          className={`${markerClass ?? ''} md:hidden`}
        />
      ) : null}
      {eyebrow ? (
        <SectionMarker
          label={eyebrow}
          className={`${markerClass ?? ''} hidden md:flex`}
        />
      ) : null}

      {!isCompact ? (
        <div className="flex flex-col gap-6">
          {copyBody}
          <OverviewMediaPanelActions
            cta={cta}
            secondaryCta={secondaryCta}
            primaryCtaDefaultVariant={primaryCtaDefaultVariant}
            className={actionsClassName}
          />
        </div>
      ) : (
        copyBody
      )}

      {footerMarker ? (
        <SectionMarker
          label={footerMarker}
          className={`${markerClass ?? ''} opacity-0`}
        />
      ) : null}

      {isCompact ? (
        <OverviewMediaPanelActions
          cta={cta}
          secondaryCta={secondaryCta}
          primaryCtaDefaultVariant={primaryCtaDefaultVariant}
          className={actionsClassName}
        />
      ) : null}
    </div>
  )

  return (
    <div className={`p-3 ${backgroundClass} ${className ?? ''}`}>
      <div
        className={`grid gap-3 md:grid-cols-2 md:items-stretch ${heightClass}`}
      >
        {imagePosition === 'left' ? (
          <>
            <div className="order-2 md:contents">{image}</div>
            <div className="order-1 md:contents">{copyPanel}</div>
          </>
        ) : (
          <>
            {copyPanel}
            {image}
          </>
        )}
      </div>
    </div>
  )
}
