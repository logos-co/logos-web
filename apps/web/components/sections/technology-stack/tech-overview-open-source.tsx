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
    <section id="open-source" className="relative border-t border-brand-dark-green/10">
      <ContentWidth className="relative h-[460px] bg-brand-off-white md:h-[421px]">
      <div className="absolute top-[39px] left-3">
        <h2 className="text-h3-serif whitespace-nowrap text-brand-dark-green">
          {data.title}
        </h2>
      </div>
      {data.subtitle ? (
        <div className="absolute top-[79px] left-3 w-[369px] max-w-[calc(100%-24px)] md:top-[39px] md:left-[calc(50%+6px)] md:w-[226px]">
          <p className="text-mono-s text-brand-dark-green">{data.subtitle}</p>
        </div>
      ) : null}

      <div className="absolute top-[136px] left-0 flex w-full flex-col md:top-[156px]">
        {data.rows.map((row, index) => (
          <div
            key={`${row.number}-${row.title}`}
            className={`relative h-[82px] w-full shrink-0 text-brand-dark-green md:h-[50px] ${
              index % 2 === 0 ? 'bg-[#dbddd7]' : 'bg-brand-dark-green/[0.05]'
            }`}
          >
            <div className="hidden md:flex">
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

            <div className="absolute top-0 left-0 flex w-[191px] flex-col items-start justify-center gap-[6px] py-3 pl-3 md:hidden">
              <h3 className="text-body-serif w-[281px] whitespace-pre-wrap">
                {row.number ? (
                  <span className="font-sans font-medium">{row.number}</span>
                ) : null}
                {row.number ? '  ' : null}
                {row.title}
              </h3>
              {row.description ? (
                <p className="text-mono-s w-[274px]">{row.description}</p>
              ) : null}
            </div>

            <div className="absolute top-px left-[298px] flex items-start gap-3 pt-3 md:hidden">
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
        ))}
      </div>
      </ContentWidth>
    </section>
  )
}
