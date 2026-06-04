import type { BuilderHubSettings } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'

export function JourneySection({
  data,
}: {
  data: NonNullable<BuilderHubSettings['journey']>
}) {
  return (
    <section className="px-3 pb-25 md:pb-25">
      <ContentWidth>
        <h2 className="font-sans text-[24px] leading-[1.1] tracking-[-0.24px] text-brand-dark-green">
          {data.title}
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-5">
          {data.links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex h-[71px] cursor-pointer flex-col items-start justify-between rounded-xl bg-brand-dark-green p-3 text-brand-off-white md:h-[83px]"
            >
              <span className="font-mono text-[10px] font-semibold leading-[1.35]">
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <span className="inline-flex items-center gap-1 text-subhead-sans">
                {link.label}
                <span className="rotate-90 [&>span]:size-[12px] md:[&>span]:size-[15px]">
                  <ButtonArrowIcon />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
