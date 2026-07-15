import { IconMask } from '@/components/icons/icon-mask'
import { Link } from '@/i18n/navigation'

import type { RoadmapAction } from './types'

function isExternalHref(href: string) {
  return href.startsWith('https://')
}

function ArrowIcon() {
  return <IconMask src="/icons/arrow-right.svg" className="size-[15px]" />
}

export function ExternalTextLink({ action }: { action: RoadmapAction }) {
  if (!action.href) {
    return <span>{action.label}</span>
  }

  if (isExternalHref(action.href)) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer underline underline-offset-2"
      >
        {action.label}
      </a>
    )
  }

  return (
    <Link
      href={action.href}
      className="cursor-pointer underline underline-offset-2"
    >
      {action.label}
    </Link>
  )
}

export function ActionPill({ action }: { action: RoadmapAction }) {
  const variant = action.variant ?? 'secondary'
  const className =
    variant === 'primary'
      ? 'inline-flex h-[31px] items-center justify-center gap-1 rounded-xl bg-brand-off-white px-3 py-2 font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap text-brand-dark-green uppercase'
      : variant === 'light'
        ? 'inline-flex items-center justify-center rounded-md bg-accent-light-blue px-1.5 py-1 font-mono-body text-[10px] leading-[1.3] whitespace-nowrap text-brand-dark-green'
        : 'inline-flex h-[31px] items-center justify-center gap-1 border border-brand-off-white px-3 py-2 font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap text-brand-off-white uppercase'

  const content = (
    <>
      <span>{action.label}</span>
      {variant === 'light' ? null : <ArrowIcon />}
    </>
  )

  if (!action.href) {
    return <span className={className}>{content}</span>
  }

  if (isExternalHref(action.href)) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} cursor-pointer`}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={action.href} className={`${className} cursor-pointer`}>
      {content}
    </Link>
  )
}
