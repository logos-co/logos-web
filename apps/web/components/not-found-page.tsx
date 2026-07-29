import { Button, ButtonArrowIcon } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

interface NotFoundPageProps {
  code: string
  eyebrow: string
  status: string
  heading: string
  description: string
  homeLink: string
}

export function NotFoundPage({
  code,
  eyebrow,
  status,
  heading,
  description,
  homeLink,
}: NotFoundPageProps) {
  return (
    <section
      aria-labelledby="not-found-heading"
      className="mx-auto flex min-h-[calc(100svh-40px)] max-w-360 flex-col px-3 pt-10 pb-15 md:min-h-[calc(100svh-42px)] md:pt-16 md:pb-20"
    >
      <div className="text-eyebrow flex items-center justify-between border-t border-brand-dark-green/20 pt-2 text-brand-dark-green">
        <span>{eyebrow}</span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-brand-yellow"
          />
          {status}
        </span>
      </div>

      <div
        aria-hidden="true"
        className="relative flex min-h-60 flex-1 items-center overflow-hidden border-b border-brand-dark-green/20 md:min-h-100"
      >
        <p className="font-display text-[clamp(10rem,34vw,31rem)] leading-[0.72] tracking-[-0.07em] text-brand-dark-green">
          {code}
        </p>
        <div className="absolute right-0 bottom-0 left-0 h-px bg-brand-dark-green/20">
          <span className="absolute right-[16.67%] bottom-1/2 size-3 translate-x-1/2 translate-y-1/2 rounded-full border border-brand-dark-green bg-brand-off-white" />
        </div>
      </div>

      <div className="grid gap-8 pt-6 md:grid-cols-12 md:gap-3 md:pt-10">
        <h1
          id="not-found-heading"
          className="text-h2 max-w-3xl text-brand-dark-green md:col-span-7"
        >
          {heading}
        </h1>
        <div className="flex max-w-sm flex-col items-start gap-6 md:col-span-4 md:col-start-9">
          <p className="text-mono-s text-brand-dark-green">{description}</p>
          <Button
            href={ROUTES.home}
            variant="primary"
            icon={<ButtonArrowIcon />}
          >
            {homeLink}
          </Button>
        </div>
      </div>
    </section>
  )
}
