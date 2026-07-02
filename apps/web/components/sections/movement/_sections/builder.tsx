import Image from 'next/image'
import type { MovementCopySection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'

import { CenterCtaSection, Cta, LambdaBadge, movementImages } from './atoms'

type DetailKey = keyof MovementCopySection['builder']['details']

export function BuilderSection({ data }: { data: MovementCopySection }) {
  const details: DetailKey[] = ['problem', 'solution', 'stack']

  return (
    <section
      id="activist-builder"
      className="bg-brand-off-white pt-0 pb-10 text-brand-dark-green md:pb-25"
    >
      <CenterCtaSection
        title={data.builder.title}
        body={data.builder.body}
        cta={
          <div className="flex flex-wrap justify-center gap-2">
            <Cta
              href={ROUTES.activistBuilder}
              label={data.builder.primaryCta}
            />
            <Cta
              href={ROUTES.buildersHub}
              label={data.builder.secondaryCta}
              tone="secondary"
            />
          </div>
        }
        className="md:py-25"
      />
      <ContentWidth className="px-3">
        <article className="relative min-h-[506px] overflow-hidden rounded-xl text-brand-off-white md:min-h-[282px]">
          <Image
            src={movementImages.issueLosAngeles}
            alt=""
            fill
            sizes="100vw"
            className="scale-125 object-cover blur-[20px]"
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative grid min-h-[506px] gap-8 p-3 md:min-h-[282px] md:grid-cols-2">
            <div className="flex min-h-[157px] flex-col justify-between md:min-h-[252px]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <LambdaBadge size={15} tone="light" circle />
                  <p className="text-subhead-serif">
                    {data.builder.feature.city}
                  </p>
                </div>
                <Cta
                  href={EXTERNAL_URLS.circlesWinnableIssueBenin}
                  label={data.builder.feature.cta}
                  tone="light"
                  className="md:hidden"
                />
              </div>
              <h3 className="text-subhead-sans mx-auto max-w-[220px] text-center md:mx-0 md:text-left">
                {data.builder.feature.title}
              </h3>
              <div className="hidden w-fit md:block">
                <Cta
                  href={EXTERNAL_URLS.circlesWinnableIssueBenin}
                  label={data.builder.feature.cta}
                  tone="light"
                />
              </div>
            </div>
            <div className="flex flex-col justify-end gap-3">
              {details.map((detail) => (
                <div
                  key={detail}
                  className="grid gap-3 border-t border-brand-off-white/50 pt-1.5 md:grid-cols-2"
                >
                  <p className="text-eyebrow">
                    {data.builder.details[detail].label}
                  </p>
                  <p className="text-mono-s">
                    {data.builder.details[detail].body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </ContentWidth>
    </section>
  )
}
