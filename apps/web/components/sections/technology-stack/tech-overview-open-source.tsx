import type { TableSection } from '@repo/content/schemas'

import { IconMask } from '@/components/icons/icon-mask'
import ContentWidth from '@/components/layout/content-width'

function ExternalLinkIcon() {
  return <IconMask src="/icons/external-link.svg" className="size-[15px]" />
}

function RowAction({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-eyebrow inline-flex cursor-pointer items-center gap-1 border-b border-brand-dark-green/50 pb-0.5 text-brand-dark-green uppercase transition-opacity hover:opacity-70"
    >
      {label}
      {label.toLowerCase() === 'repo' ? <ExternalLinkIcon /> : null}
    </a>
  )
}

type Props = {
  data: TableSection
}

export default function TechOverviewOpenSource({ data }: Props) {
  return (
    <section
      id="open-source"
      className="relative border-t border-brand-dark-green/10"
    >
      <ContentWidth className="bg-brand-off-white pt-[39px] xl:relative xl:h-[421px] xl:pt-0">
        <div className="xl:absolute xl:top-[39px] xl:left-3">
          <h2 className="text-h3-serif whitespace-nowrap text-brand-dark-green">
            {data.title}
          </h2>
        </div>
        {data.subtitle ? (
          <div className="mt-4 w-full max-w-[640px] xl:absolute xl:top-[39px] xl:left-[calc(50%+6px)] xl:mt-0 xl:w-[226px]">
            <p className="text-mono-s text-brand-dark-green">
              {data.subtitle}
            </p>
          </div>
        ) : null}

        <div className="mt-[18px] -mx-3 flex w-[calc(100%+24px)] flex-col xl:absolute xl:top-[156px] xl:left-0 xl:mx-0 xl:mt-0 xl:w-full">
          {data.rows.map((row, index) => (
            <div
              key={`${row.number}-${row.title}`}
              className={`relative h-[82px] w-full shrink-0 text-brand-dark-green md:min-h-[154px] md:h-auto xl:h-[50px] xl:min-h-0 ${
                index % 2 === 0 ? 'bg-[#dbddd7]' : 'bg-brand-dark-green/[0.05]'
              }`}
            >
              <div className="hidden xl:flex">
                <div className="flex w-[714px] items-baseline gap-3 py-3 pl-3">
                  {row.number ? (
                    <span className="text-body-sans w-[18px] font-medium">
                      {row.number}
                    </span>
                  ) : null}
                  <h3 className="text-body-serif whitespace-nowrap">
                    {row.title}
                  </h3>
                </div>

                {row.description ? (
                  <p className="text-mono-s w-[464px] py-3">
                    <span className="block w-[312px]">{row.description}</span>
                  </p>
                ) : null}

                <div className="flex items-start gap-3 pt-3">
                  {row.cta ? (
                    <RowAction href={row.cta.href} label={row.cta.label} />
                  ) : null}
                  {row.secondaryCta ? (
                    <RowAction
                      href={row.secondaryCta.href}
                      label={row.secondaryCta.label}
                    />
                  ) : null}
                </div>
              </div>

              <div className="flex min-h-[inherit] w-full items-start justify-between gap-3 px-3 py-3 md:gap-6 md:px-6 md:py-6 xl:hidden">
                <div className="min-w-0 max-w-[calc(100%-132px)] md:max-w-[calc(100%-160px)]">
                  <h3 className="text-body-serif whitespace-pre-wrap">
                    {row.number ? (
                      <span className="font-sans font-medium">
                        {row.number}
                      </span>
                    ) : null}
                    {row.number ? '  ' : null}
                    {row.title}
                  </h3>
                  {row.description ? (
                    <p className="text-mono-s mt-1 line-clamp-2 md:mt-3 md:line-clamp-none">
                      {row.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-start gap-5 md:gap-6">
                  {row.cta ? (
                    <RowAction href={row.cta.href} label={row.cta.label} />
                  ) : null}
                  {row.secondaryCta ? (
                    <RowAction
                      href={row.secondaryCta.href}
                      label={row.secondaryCta.label}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
