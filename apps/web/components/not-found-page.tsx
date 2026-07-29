import { Button, ButtonArrowIcon } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

interface NotFoundPageProps {
  code: string
  heading: string
  homeLink: string
}

export function NotFoundPage({ code, heading, homeLink }: NotFoundPageProps) {
  return (
    <section
      aria-labelledby="not-found-heading"
      className="flex min-h-[calc(100svh-40px)] items-center justify-center px-3 py-20 md:min-h-[calc(100svh-42px)]"
    >
      <div className="flex max-w-4xl flex-col items-center gap-6 text-center">
        <h1 id="not-found-heading" className="text-h2 text-brand-dark-green">
          {code}
        </h1>
        <p className="text-body-sans text-brand-dark-green">{heading}</p>
        <Button href={ROUTES.home} variant="primary" icon={<ButtonArrowIcon />}>
          {homeLink}
        </Button>
      </div>
    </section>
  )
}
