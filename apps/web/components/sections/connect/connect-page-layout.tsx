import { LogosMark } from '@acid-info/logos-ui'
import type { ReactNode } from 'react'

type Props = {
  heading: string
  intro?: string
  children: ReactNode
}

export function ConnectPageLayout({ heading, intro, children }: Props) {
  return (
    <div className="bg-brand-off-white px-3 pt-16 pb-20 text-brand-dark-green">
      <div className="mx-auto w-full max-w-[800px]">
        <div className="mb-12 text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <LogosMark size={26} className="w-5 shrink-0" />
            <h1 className="font-display text-[30px] leading-none tracking-[-0.9px] md:text-[36px] md:tracking-[-1.08px]">
              {heading}
            </h1>
          </div>
          {intro ? (
            <p className="mx-auto max-w-[40em] text-balance font-mono text-[10px] leading-[1.3]">
              {intro}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  )
}
