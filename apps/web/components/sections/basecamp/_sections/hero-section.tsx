import type { HeroSection } from '@repo/content/schemas'
import { LogosMark } from '@acid-info/logos-ui'

import { ButtonArrowIcon } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { Link } from '@/i18n/navigation'

import { BasecampCta, BodyDetailBlock, paragraphs } from './atoms'

function HeroTitle({ headline }: { headline: string }) {
  return (
    <h1 className="text-h3-serif flex items-center gap-3 self-start text-brand-dark-green">
      <span className="flex shrink-0 items-center text-gray-03 md:hidden">
        <LogosMark size={22} />
      </span>
      <span className="hidden shrink-0 text-gray-03 md:flex">
        <LogosMark size={28} />
      </span>
      {headline}
    </h1>
  )
}

function HeroBackLink({ eyebrow }: { eyebrow: string }) {
  return (
    <Link
      href={ROUTES.technologyStack}
      className="inline-flex cursor-pointer items-center gap-1 text-brand-dark-green transition-opacity hover:opacity-70"
    >
      <span className="inline-flex size-3.75 shrink-0 rotate-180 items-center justify-center">
        <ButtonArrowIcon />
      </span>
      <span className="font-mono text-[10px] leading-[1.3] font-medium uppercase">
        {eyebrow}
      </span>
    </Link>
  )
}

function HeroBodyColumn({
  body,
  bodyDetails,
  ctas,
}: {
  body?: string
  bodyDetails: string[]
  ctas?: HeroSection['ctas']
}) {
  return (
    <div className="flex max-w-[393px] flex-col gap-6 md:max-w-none">
      <div className="flex w-full max-w-[342px] flex-col gap-6 md:max-w-86">
        {body ? (
          <p className="text-mono-s text-brand-dark-green">{body}</p>
        ) : null}
        {bodyDetails.length > 0 ? (
          <div className="text-mono-s flex flex-col gap-4 text-brand-dark-green">
            {bodyDetails.map((item) => (
              <BodyDetailBlock key={item} text={item} />
            ))}
          </div>
        ) : null}
        <div className="h-px w-full bg-brand-dark-green/10" />
      </div>
      {ctas ? (
        <div className="flex flex-wrap items-start gap-1 md:flex-col md:gap-6">
          {ctas.map((cta) => (
            <BasecampCta key={cta.label} cta={cta} className="cursor-pointer" />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function HeroSectionView({ data }: { data: HeroSection }) {
  const bodyDetails = paragraphs(data.bodySecondary)

  return (
    <section className="w-full min-h-[437px] md:min-h-[500px] md:pt-[27px]">
      <div className="relative px-3 pb-[53px] md:hidden">
        {data.eyebrow ? (
          <div className="absolute top-[23px] left-3 z-30">
            <HeroBackLink eyebrow={data.eyebrow} />
          </div>
        ) : null}
        <div className="absolute top-[66px] left-3">
          <HeroTitle headline={data.headline} />
        </div>
        <div className="pt-[135px]">
          <HeroBodyColumn
            body={data.body}
            bodyDetails={bodyDetails}
            ctas={data.ctas}
          />
        </div>
      </div>

      {data.eyebrow ? (
        <div className="relative z-30 hidden px-3 md:block">
          <HeroBackLink eyebrow={data.eyebrow} />
        </div>
      ) : null}

      <div className="hidden w-full gap-5 px-3 pb-2 md:mb-[130px] md:grid md:grid-cols-4 md:gap-3 md:pt-7.5 md:pb-0">
        <div className="md:col-span-2">
          <HeroTitle headline={data.headline} />
        </div>
        <div className="md:col-span-2">
          <HeroBodyColumn
            body={data.body}
            bodyDetails={bodyDetails}
            ctas={data.ctas}
          />
        </div>
      </div>
    </section>
  )
}
