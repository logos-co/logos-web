import { LogosMark } from '@acid-info/logos-ui'
import type { ReactNode } from 'react'

type Props = {
  heading?: string
  intro?: ReactNode
  children: ReactNode
}

export function ConnectPageLayout({ heading, intro, children }: Props) {
  return (
    <div className="bg-brand-off-white px-3 pt-16 pb-20 text-brand-dark-green">
      <div className="mx-auto w-full max-w-[800px]">
        {(heading || intro) && (
          <div className={`text-center${intro ? ' mb-12' : ' mb-6'}`}>
            {heading ? (
              <div className="mb-6 flex items-center justify-center gap-3">
                <LogosMark size={28} className="w-5 shrink-0" />
                <h1 className="font-display text-[30px] leading-none tracking-[-0.9px] md:text-[36px] md:tracking-[-1.08px]">
                  {heading}
                </h1>
              </div>
            ) : null}
            {intro}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
