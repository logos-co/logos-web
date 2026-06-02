/**
 * Shared presentational atoms for the circles listing page sections.
 */
import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'

export function SectionIntro({
  title,
  description,
  cta,
}: {
  title: string
  description?: string
  cta?: { label: string; href: string; external?: boolean }
}) {
  return (
    <ContentWidth className="grid grid-cols-2 gap-3 px-3 py-10 md:grid-cols-12 md:py-10">
      <h2 className="font-display text-[30px] leading-none text-brand-dark-green md:col-span-4 md:text-[36px]">
        {title}
      </h2>
      {description ? (
        <p className="text-mono-s col-start-2 text-brand-dark-green md:col-span-3 md:col-start-7 md:w-[226px]">
          {description}
        </p>
      ) : null}
      {cta ? (
        <Button
          href={cta.href}
          variant="link"
          className="col-start-2 w-fit self-start md:col-span-2 md:col-start-11"
          {...(cta.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {cta.label}
        </Button>
      ) : null}
    </ContentWidth>
  )
}
