import Image from 'next/image'
import type { BuilderHubHomeRfpResolution } from '@repo/content/loaders'
import type { BuilderHubSettings } from '@repo/content/schemas'
import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import { Link } from '@/i18n/navigation'

interface DeveloperProgramsSectionProps {
  id: string
  index: string
  title: string
  data: NonNullable<BuilderHubSettings['programs']>
  rfps: BuilderHubHomeRfpResolution['rfps']
}

export function DeveloperProgramsSection({
  id,
  index,
  title,
  data,
  rfps,
}: DeveloperProgramsSectionProps) {
  const previewRfps = rfps.filter((rfp) => !rfp.featured).slice(0, 4)

  return (
    <section id={id} className="border-t border-brand-dark-green/10 pt-6 pb-25">
      <ContentWidth>
        <h2 className="flex items-baseline gap-3 text-[24px] leading-[1.1] tracking-[-0.24px] whitespace-nowrap">
          <span className="font-display text-brand-dark-green/50">{index}</span>
          <span className="font-sans text-brand-dark-green">{title}</span>
        </h2>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          <Link
            href={data.prizeHref}
            aria-label={`${data.prizeTitle}: ${data.prizeHeading}`}
            className="relative flex h-[370px] cursor-pointer flex-col items-center justify-center gap-10 overflow-hidden rounded-xl px-4 py-10 text-center text-brand-off-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green"
          >
            <Image
              src={data.prizeImage.src}
              alt={data.prizeImage.alt}
              fill
              sizes="50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative inline-flex items-center gap-[9px]">
              <LogosMark size={18} />
              <span className="text-h4-serif">{data.prizeTitle}</span>
            </div>
            <div className="relative flex flex-col items-center gap-3">
              <h3 className="text-subhead-sans">{data.prizeHeading}</h3>
              <p className="w-full max-w-[338px] text-mono-s">
                {data.prizeDescription}
              </p>
            </div>
          </Link>

          <Link
            href={data.rfpsHref}
            aria-label={data.rfpsTitle}
            className="flex h-[370px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-brand-dark-green px-4 py-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green"
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <h3 className="text-subhead-sans">{data.rfpsTitle}</h3>
              <p className="w-full max-w-[338px] text-mono-s">
                {data.rfpsDescription}
              </p>
            </div>
            <div className="mt-15 flex w-full justify-center gap-3 md:w-[1416px] md:-translate-x-[176px] md:justify-start">
              {previewRfps.map((rfp, itemIndex) => (
                <div
                  key={rfp.slug}
                  className={`relative hidden h-[166px] w-full max-w-[345px] shrink-0 overflow-hidden rounded-xl border border-brand-dark-green/50 p-4 first:block md:block md:w-[345px] ${
                    itemIndex % 2 === 1 ? 'opacity-50' : ''
                  }`}
                >
                  <h4 className="w-[249px] text-h4-sans">{rfp.title}</h4>
                  <span className="absolute top-[83px] left-4 font-mono text-[10px] font-semibold uppercase underline underline-offset-[3px]">
                    {rfp.ctaLabel ?? data.rfpsTitle}
                  </span>
                  <p className="absolute bottom-4 left-4 w-[186px] text-mono-s">
                    {rfp.tagline ?? rfp.summary}
                  </p>
                  {rfp.image ? (
                    <Image
                      src={rfp.image.src}
                      alt={rfp.image.alt}
                      width={96}
                      height={120}
                      className="absolute right-[10px] bottom-[11px] h-[120px] w-[96px] object-cover max-[400px]:hidden"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </Link>
        </div>
      </ContentWidth>
    </section>
  )
}
