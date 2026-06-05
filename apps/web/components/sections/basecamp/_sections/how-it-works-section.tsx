import Image from 'next/image'

import type { CTA, TableSection } from '@repo/content/schemas'

import { BasecampCta } from './atoms'

export function HowItWorksSection({ data }: { data: TableSection }) {
  const downloadActions = [
    data.action,
    data.rows[0]?.secondaryCta,
    data.rows[0]?.cta,
  ].filter((cta): cta is CTA => Boolean(cta))

  return (
    <section className="grid w-full gap-6 px-3 py-10 md:grid-cols-2 md:pt-0 md:pb-10">
      <div className="flex flex-col gap-6 md:min-h-[321px] lg:min-h-[435px] xl:min-h-[549px] desktop:min-h-[621px] md:justify-between md:gap-8">
        <div>
          <h2 className="text-h3-sans mb-[14px] text-brand-dark-green">
            {data.title}
          </h2>
          <div className="divide-y divide-brand-dark-green/50 border-t border-brand-dark-green/50">
            {data.rows.map((row) => (
              <article
                key={row.number}
                className="grid gap-4 pt-[6px] pb-3 md:grid-cols-2 md:gap-3"
              >
                <span className="text-eyebrow text-brand-dark-green">
                  {row.number}
                </span>
                <div className="grid gap-2">
                  {row.description ? (
                    <p className="text-mono-s text-brand-dark-green">
                      {row.description}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
        {downloadActions.length > 0 ? (
          <div className="flex flex-wrap items-start gap-1">
            {downloadActions.map((cta) => (
              <BasecampCta
                key={cta.label}
                cta={cta}
                className="cursor-pointer"
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className="relative aspect-[351/313] md:aspect-auto md:h-[321px] lg:h-[435px] xl:h-[549px] desktop:h-[621px] overflow-hidden rounded-xl">
        <Image
          src="/images/home/figma-refresh/basecamp.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) calc(100vw - 24px), (max-width: 1440px) calc(50vw - 24px), 696px"
          className="object-cover object-[16%_top]"
        />
      </div>
    </section>
  )
}
