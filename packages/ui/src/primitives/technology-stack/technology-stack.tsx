import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

import { LogosMark } from '../../icons/logos-mark'

export { DownloadIcon } from '../../icons/download-icon'

type Tone = 'dark' | 'light'

export type SectionMarkerProps = {
  label: string
  className?: string
}

export function SectionMarker({ label, className }: SectionMarkerProps) {
  return (
    <div className={twMerge('flex items-start gap-25.5', className)}>
      <LogosMark size={9} className="mt-0 shrink-0 text-brand-dark-green" />
      <p className="text-eyebrow w-46.25 text-brand-dark-green">{label}</p>
    </div>
  )
}

export type TechDetailHeroItem = {
  title: string
  description?: string
}

export type TechDetailHeroStatus = {
  label: string
  body: string
  cta?: ReactNode
  secondaryCta?: ReactNode
}

export type TechDetailHeroProps = {
  backLink: ReactNode
  title: string
  body?: string
  bodySecondary?: string
  items?: readonly TechDetailHeroItem[]
  status?: TechDetailHeroStatus
  actions?: ReactNode
  titleIcon?: ReactNode
  className?: string
}

export function TechDetailHero({
  backLink,
  title,
  body,
  bodySecondary,
  items,
  status,
  actions,
  titleIcon,
  className,
}: TechDetailHeroProps) {
  return (
    <section
      className={twMerge(
        'mb-15 h-135 bg-brand-off-white md:mb-25 md:h-[414px] md:pt-7.5',
        className
      )}
    >
      <div className="relative mx-auto h-full max-w-360 px-3 pt-10 text-brand-dark-green md:hidden">
        <div className="absolute top-[21px] left-3 z-51">{backLink}</div>

        <h1 className="text-h3-serif absolute top-[60px] left-3 flex items-center gap-3">
          {titleIcon ?? (
            <LogosMark size={22} className="shrink-0 text-gray-03" />
          )}
          {title}
        </h1>

        <div className="absolute top-[122px] left-3 flex w-[calc(100%-24px)] max-w-92.25 flex-col text-black">
          {actions ? (
            <div className="flex flex-wrap items-start gap-1.5">{actions}</div>
          ) : null}

          {body ? <p className="text-mono-s mt-6 max-w-85.5">{body}</p> : null}

          {bodySecondary ? (
            <div className="text-mono-s mt-5 flex flex-col gap-2">
              <p>{bodySecondary}</p>
              {items?.map((item) => (
                <p key={item.title}>
                  <span className="font-mono font-semibold">{item.title}</span>
                  {item.description ? ` — ${item.description}` : null}
                </p>
              ))}
            </div>
          ) : null}

          {status ? (
            <div className="border-brand-dark-green/10 mt-6 flex flex-col gap-3 border-t pt-6">
              <span className="text-eyebrow w-fit rounded bg-brand-yellow px-1 py-0.5 text-brand-dark-green">
                {status.label}
              </span>
              <p className="text-mono-s max-w-86 text-black">{status.body}</p>
              <div className="flex flex-wrap items-center gap-3">
                {status.cta}
                {status.secondaryCta}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative z-51 mx-auto hidden max-w-360 px-3 md:block">
        {backLink}
      </div>

      <div className="mx-auto hidden max-w-360 gap-5 px-3 pt-4 pb-2 text-brand-dark-green md:grid md:grid-cols-4 md:gap-3 md:pt-7.5 md:pb-23">
        <h1 className="text-h3-serif flex self-start items-center gap-3 md:col-span-2">
          {titleIcon ?? (
            <LogosMark size={42} className="shrink-0 text-gray-03" />
          )}
          {title}
        </h1>

        <div className="md:col-span-2 md:grid md:grid-cols-2 md:gap-3">
          <div className="flex flex-col gap-6">
            {body ? (
              <p className="text-mono-s max-w-86 text-black">{body}</p>
            ) : null}

            {bodySecondary ? (
              <div className="text-mono-s flex flex-col gap-3 text-black">
                <p>{bodySecondary}</p>
                {items?.map((item) => (
                  <p key={item.title}>
                    <span className="font-mono font-semibold">
                      {item.title}
                    </span>
                    {item.description ? ` — ${item.description}` : null}
                  </p>
                ))}
              </div>
            ) : null}

            {status ? (
              <div className="border-brand-dark-green/10 flex flex-col gap-6 border-t pt-6">
                <span className="text-eyebrow w-fit rounded bg-brand-yellow px-1 py-0.5 text-brand-dark-green">
                  {status.label}
                </span>
                <p className="text-mono-s max-w-86 text-black">{status.body}</p>
                <div className="flex flex-wrap items-center gap-3">
                  {status.cta}
                  {status.secondaryCta}
                </div>
              </div>
            ) : null}
          </div>

          {actions ? (
            <div className="flex flex-wrap items-start justify-end gap-3">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export type TechBuilderCtaCard = {
  title: string
  description?: string
  cta?: ReactNode
  image?: ReactNode
}

export type TechTextSplitSectionProps = {
  title: ReactNode
  body?: ReactNode
  className?: string
  contentClassName?: string
}

export function TechTextSplitSection({
  title,
  body,
  className,
  contentClassName,
}: TechTextSplitSectionProps) {
  return (
    <section
      className={twMerge(
        'h-62 bg-brand-off-white md:h-[183px] md:border-t md:border-brand-dark-green/10',
        className
      )}
    >
      <div className="mx-auto grid max-w-360 gap-4 px-3 py-10 text-brand-dark-green md:grid-cols-4 md:gap-3 md:pt-10 md:pb-0">
        <h2 className="text-h4-sans md:col-span-2">{title}</h2>

        <div
          className={twMerge(
            'text-mono-s flex min-w-0 max-w-86 flex-col gap-5 break-words md:col-span-2',
            contentClassName
          )}
        >
          {body}
        </div>
      </div>
    </section>
  )
}

export type TechBuilderCtaDeckProps = {
  cards: readonly TechBuilderCtaCard[]
  className?: string
  deckClassName?: string
  cardClassName?: string
  builderHubClassName?: string
  builderHubImageClassName?: string
  logosAppClassName?: string
  contentWrapperClassName?: string
}

export function TechBuilderCtaCardContent({
  title,
  body,
  cta,
  tone,
  wrapperClassName,
}: {
  title: string
  body?: string
  cta?: ReactNode
  tone: Tone
  wrapperClassName?: string
}) {
  const textColor =
    tone === 'dark' ? 'text-brand-dark-green' : 'text-brand-off-white'

  return (
    <div
      className={twMerge(
        'flex flex-col items-center justify-center gap-10',
        wrapperClassName
      )}
    >
      <div
        className={twMerge(
          'flex w-full max-w-108 flex-col items-center gap-3 px-4 text-center',
          textColor
        )}
      >
        <p className="text-subhead-sans w-full">{title}</p>
        {body ? <p className="text-mono-s w-full max-w-95">{body}</p> : null}
      </div>
      {cta}
    </div>
  )
}

export function TechBuilderCtaDeck({
  cards,
  className,
  deckClassName,
  cardClassName,
  builderHubClassName,
  builderHubImageClassName,
  logosAppClassName,
  contentWrapperClassName,
}: TechBuilderCtaDeckProps) {
  const [docsCard, builderHubCard, logosAppCard] = cards

  return (
    <section className={twMerge('bg-brand-off-white', className)}>
      <div
        className={twMerge(
          'mx-auto flex max-w-360 flex-col gap-3 px-3 py-10 md:flex-row md:items-start',
          deckClassName
        )}
      >
        {docsCard ? (
          <div
            className={twMerge(
              'flex h-75 w-full flex-col items-center justify-center overflow-hidden border border-brand-dark-green p-4 md:h-125 md:flex-1',
              cardClassName
            )}
          >
            <TechBuilderCtaCardContent
              title={docsCard.title}
              body={docsCard.description}
              tone="dark"
              wrapperClassName={contentWrapperClassName}
              cta={docsCard.cta}
            />
          </div>
        ) : null}

        {builderHubCard ? (
          <div
            className={twMerge(
              'relative h-75 w-full overflow-hidden rounded-[200px] bg-brand-dark-green md:h-125 md:flex-1',
              builderHubClassName
            )}
          >
            {builderHubCard.image ? (
              <div
                className={twMerge(
                  'pointer-events-none absolute inset-0 overflow-hidden [&>*]:size-full [&>*]:object-cover',
                  builderHubImageClassName
                )}
              >
                {builderHubCard.image}
              </div>
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center">
              <TechBuilderCtaCardContent
                title={builderHubCard.title}
                body={builderHubCard.description}
                tone="light"
                wrapperClassName={contentWrapperClassName}
                cta={builderHubCard.cta}
              />
            </div>
          </div>
        ) : null}

        {logosAppCard ? (
          <div
            className={twMerge(
              'flex h-75 w-full flex-col items-center justify-center overflow-hidden rounded-[60px] bg-gray-01 p-4 md:h-125 md:flex-1',
              logosAppClassName
            )}
          >
            <TechBuilderCtaCardContent
              title={logosAppCard.title}
              body={logosAppCard.description}
              tone="dark"
              wrapperClassName={contentWrapperClassName}
              cta={logosAppCard.cta}
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

export type TechCaseStudyCardProps = {
  title: string
  body: ReactNode
  image: ReactNode
  cta?: ReactNode
  markerLabel: string
  className?: string
  contentClassName?: string
  imageClassName?: string
}

export function TechCaseStudyCard({
  title,
  body,
  image,
  cta,
  markerLabel,
  className,
  contentClassName,
  imageClassName,
}: TechCaseStudyCardProps) {
  return (
    <article
      className={twMerge(
        'relative h-[299px] overflow-hidden rounded-xl border border-brand-dark-green/50 md:h-[406px] md:flex-1',
        className
      )}
    >
      <div
        className={twMerge(
          'absolute top-3 left-3 flex h-[263px] w-[348px] flex-col justify-between md:h-[380px] md:w-[453px]',
          contentClassName
        )}
      >
        <SectionMarker
          label={markerLabel}
          className="scale-[0.98] origin-left"
        />

        <div className="flex flex-col gap-6 text-brand-dark-green">
          <h3 className="text-subhead-sans w-[195px] md:w-57">{title}</h3>
          <div className="text-mono-s w-[344px] md:w-[453px]">{body}</div>
        </div>
      </div>

      {cta ? (
        <div className="absolute top-3 right-3 hidden md:block">{cta}</div>
      ) : null}

      <div className={imageClassName}>{image}</div>
    </article>
  )
}

export type TechUseCaseCard = {
  markerLabel: string
  title: string
  body?: ReactNode
  cta?: ReactNode
  image?: ReactNode
}

export type TechUseCaseGridProps = {
  cards: readonly TechUseCaseCard[]
  className?: string
  gridClassName?: string
  cardClassName?: string
}

export function TechUseCaseGrid({
  cards,
  className,
  gridClassName,
  cardClassName,
}: TechUseCaseGridProps) {
  return (
    <section
      className={twMerge(
        'h-[576px] bg-brand-off-white md:h-[362px]',
        className
      )}
    >
      <div
        className={twMerge(
          'mx-auto flex max-w-360 flex-col gap-3 px-3 md:flex-row md:py-10',
          gridClassName
        )}
      >
        {cards.map((card) => (
          <article
            key={card.title}
            className={twMerge(
              'relative h-[282px] w-full overflow-hidden bg-brand-dark-green md:flex-1',
              cardClassName
            )}
          >
            {card.image ? (
              <div className="pointer-events-none absolute inset-0 [&>*]:size-full [&>*]:object-cover">
                {card.image}
              </div>
            ) : null}
            <div className="absolute inset-0 bg-brand-dark-green/25" />

            <div className="relative z-10 flex h-full flex-col justify-between p-3 text-brand-off-white">
              <SectionMarker
                label={card.markerLabel}
                className="text-brand-off-white [&_p]:text-brand-off-white [&_svg]:text-brand-off-white"
              />

              <h3 className="text-subhead-sans absolute top-1/2 left-1/2 w-full max-w-55 -translate-x-1/2 -translate-y-1/2 text-center">
                {card.title}
              </h3>

              <div className="text-mono-s w-55">{card.body}</div>
            </div>

            {card.cta ? (
              <div className="absolute top-3 right-3 z-10">{card.cta}</div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
