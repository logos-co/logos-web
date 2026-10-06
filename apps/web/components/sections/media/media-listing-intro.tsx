import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import { ButtonArrowIcon } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { Link } from '@/i18n/navigation'

interface MediaListingIntroCopy {
  title: string
  description: string
  byline?: string
  backToMedia: string
}

export function MediaListingIntro({ copy }: { copy: MediaListingIntroCopy }) {
  return (
    <section className="bg-accent-tan pb-12 pt-8 text-brand-dark-green md:pb-16">
      <ContentWidth className="flex w-full flex-col gap-10 md:gap-11.5">
        <Link
          href={ROUTES.media}
          className="inline-flex w-fit cursor-pointer items-center gap-1 text-brand-dark-green transition-opacity hover:opacity-70"
        >
          <span className="inline-flex size-3.75 shrink-0 rotate-180 items-center justify-center">
            <ButtonArrowIcon />
          </span>
          <span className="font-mono text-xs leading-[1.3] font-medium uppercase">
            {copy.backToMedia}
          </span>
        </Link>
        <div className="grid w-full items-start gap-6 md:grid-cols-12">
          <div className="flex items-center gap-3 md:col-span-5">
            <LogosMark size={20} className="shrink-0" />
            <h1 className="font-display text-[30px] leading-none tracking-[-0.03em] md:text-[36px]">
              {copy.title}
            </h1>
          </div>
          <div className="text-mono-s flex min-w-0 flex-col gap-6 text-black md:col-start-7 md:col-end-10">
            <p className="wrap-break-word">{copy.description}</p>
            {copy.byline ? <p>{copy.byline}</p> : null}
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}
