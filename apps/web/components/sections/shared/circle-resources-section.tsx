import { type CircleResource } from '@repo/content/loaders'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'
import { Link } from '@/i18n/navigation'

/** True for absolute http(s) URLs — used to choose `<a>` vs locale-aware `<Link>`. */
const isExternalHref = (href: string) => /^https?:\/\//.test(href)

export function CircleResourcesSection({
  title,
  description,
  cta,
  resources,
}: {
  title: string
  description?: string
  cta?: { label: string; href: string; external?: boolean }
  resources: CircleResource[]
}) {
  return (
    <section
      id="resources"
      className="border-t border-brand-dark-green/10 bg-brand-off-white pb-15"
    >
      <ContentWidth className="grid grid-cols-2 gap-3 px-3 py-10 md:grid-cols-12 md:py-10">
        <h2 className="font-display text-[30px] leading-none text-brand-dark-green md:col-span-4 md:text-[36px]">
          {title}
        </h2>
        {description ? (
          <p className="text-mono-s col-start-2 text-brand-dark-green md:col-span-3 md:col-start-7 md:max-w-[226px]">
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

      <ContentWidth>
        <ul className="w-full">
          {resources.map((resource, index) => {
            const rowClass = `grid min-h-[58px] grid-cols-[minmax(0,1fr)_83px] items-center gap-3 px-3 py-3 text-brand-dark-green transition-colors hover:bg-brand-dark-green/10 md:min-h-[50px] md:grid-cols-12 md:items-start ${
              index % 2 === 0 ? 'bg-gray-01' : 'bg-brand-dark-green/5'
            }`
            const rowContent = (
              <>
                <div className="flex gap-3 md:col-span-4">
                  <span className="w-[26px] font-sans text-[14px] font-medium leading-[1.2]">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="font-display text-[14px] leading-[1.2]">
                    {resource.title}
                  </span>
                </div>
                <p className="text-mono-s hidden md:col-span-4 md:col-start-7 md:block md:max-w-[312px]">
                  {resource.description}
                </p>
                <span className="text-eyebrow w-fit justify-self-end border-b border-brand-dark-green/50 md:col-span-2 md:col-start-11 md:justify-self-start">
                  {resource.ctaLabel}
                </span>
              </>
            )

            return (
              <li key={resource.slug}>
                {isExternalHref(resource.href) ? (
                  <a
                    href={resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={rowClass}
                  >
                    {rowContent}
                  </a>
                ) : (
                  <Link href={resource.href} className={rowClass}>
                    {rowContent}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </ContentWidth>
    </section>
  )
}
