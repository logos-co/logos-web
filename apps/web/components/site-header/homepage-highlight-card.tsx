'use client'

import clsx from 'clsx'
import Image from 'next/image'
import type { ReactNode } from 'react'

import type { HomepageHighlight } from '@repo/content/schemas'
import { XIcon } from '@acid-info/logos-ui'

import { IconMask } from '@/components/icons/icon-mask'
import { ExternalLink } from '@/components/ui/external-link'
import { Link } from '@/i18n/navigation'

function ArrowIcon() {
  return <IconMask src="/icons/right-arrow.svg" className="size-[15px]" />
}

function HighlightLink({
  href,
  className,
  children,
}: {
  href: string
  className: string
  children: ReactNode
}) {
  if (href.startsWith('http')) {
    return (
      <ExternalLink href={href} className={className}>
        {children}
      </ExternalLink>
    )
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

export function HomepageHighlightCard({
  data,
  onDismiss,
}: {
  data: HomepageHighlight
  onDismiss: () => void
}) {
  return (
    <div
      className={clsx(
        'absolute top-2 left-3 z-10 w-[calc(100vw-24px)] max-w-none rounded-[6px] bg-gray-01 text-brand-dark-green',
        'md:left-[119px] md:w-[calc(50vw-137px)] md:max-w-[345px] md:bg-gray-06 md:text-brand-off-white'
      )}
    >
      <HighlightLink
        href={data.cta.href}
        className={clsx(
          'group flex cursor-pointer items-center gap-3 rounded-[6px] py-0.5 pr-7 pl-0.5 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green',
          'md:items-start md:gap-2 md:p-1 md:focus-visible:outline-brand-off-white'
        )}
      >
        <span className="relative h-[65px] w-[65px] shrink-0 overflow-hidden rounded-[4px] md:h-11 md:w-[37px]">
          <Image
            src={data.image.src}
            alt={data.image.alt}
            fill
            sizes="(max-width: 767px) 65px, 37px"
            className="object-cover"
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start justify-center gap-[3px] py-1 md:justify-start md:py-0">
          <span className="text-mono-s block w-full text-brand-dark-green md:text-brand-off-white">
            {data.body}
          </span>
          <span className="flex items-center gap-1 font-mono text-xs leading-[1.35] font-semibold text-brand-dark-green uppercase md:text-brand-off-white">
            {data.cta.label}
            <ArrowIcon />
          </span>
        </span>
      </HighlightLink>

      <button
        type="button"
        onClick={onDismiss}
        aria-label={data.dismissAriaLabel}
        className="absolute top-1 right-1 z-10 inline-flex size-5 cursor-pointer items-center justify-center rounded-full border border-current transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <XIcon size={12} />
      </button>
    </div>
  )
}
