import { LogosMark, LogosWordmark } from '@acid-info/logos-ui'

export function BrandLockup({ markSize = 28 }: { markSize?: number }) {
  return (
    <span className="brand-lockup" aria-label="Logos">
      <LogosMark size={markSize} />
      <LogosWordmark />
    </span>
  )
}

export function ResponsiveCopy({
  desktop,
  mobile,
}: {
  desktop: string
  mobile: string
}) {
  return (
    <>
      <span className="desktop-copy">{desktop}</span>
      <span className="mobile-copy">{mobile}</span>
    </>
  )
}
