'use client'

import clsx from 'clsx'
import Image from 'next/image'
import type { ReactNode } from 'react'

import type { HomepageHighlight } from '@repo/content/schemas'

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
}: {
  data: HomepageHighlight
}) {
  return (
    <HighlightLink
      href={data.cta.href}
      className={clsx(
        'group absolute z-10 flex cursor-pointer rounded-[6px] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'top-2 left-3 w-[calc(100vw-24px)] max-w-none items-center gap-3 bg-gray-01 py-0.5 pr-1 pl-0.5 text-brand-dark-green focus-visible:outline-brand-dark-green',
        'md:left-[119px] md:w-[calc(50vw-137px)] md:max-w-[345px] md:items-start md:gap-2 md:bg-gray-06 md:p-1 md:text-brand-off-white md:focus-visible:outline-brand-off-white'
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
        <span className="flex items-center gap-1 font-mono text-[10px] leading-[1.35] font-semibold text-brand-dark-green uppercase md:text-brand-off-white">
          {data.cta.label}
          <ArrowIcon />
        </span>
      </span>
    </HighlightLink>
  )
}
