import type { BuilderHubSettings } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Link } from '@/i18n/navigation'

import { externalProps } from './atoms'

export function DocumentationSection({
  data,
}: {
  data: NonNullable<BuilderHubSettings['documentation']>
}) {
  return (
    <section
      id="resources"
      className="border-t border-brand-dark-green/10 bg-brand-off-white pt-[39px] pb-25 text-brand-dark-green"
    >
      <ContentWidth>
        <div className="md:grid md:grid-cols-[1fr_1fr] md:gap-3">
          <h2 className="text-h3-serif whitespace-nowrap">{data.title}</h2>
          <p className="mt-5 w-[226px] text-mono-s md:mt-0">
            {data.description}
          </p>
        </div>

        <div className="mt-[31px] grid gap-3 md:mt-19.5 md:grid-cols-3">
          {data.categories.map((category) => (
            <div key={category.title} className="min-w-0 w-full">
              <h3 className="flex h-[45px] items-start px-3 py-3 text-subhead-sans">
                {category.title}
              </h3>
              <ul className="overflow-hidden rounded-xl">
                {category.links.map((link, index) => (
                  <li key={`${category.title}-${link.title}-${index}`}>
                    <Link
                      href={link.cta.href}
                      aria-label={`${link.title}: ${link.cta.label}`}
                      className={`flex min-h-[60px] min-w-0 cursor-pointer items-start gap-3 py-3 pr-3 pl-3 transition-colors hover:bg-accent-light-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow ${
                        index % 2 === 0 ? 'bg-gray-01' : 'bg-brand-dark-green/5'
                      }`}
                      {...externalProps(link.cta)}
                    >
                      <span className="w-[18px] shrink-0 pt-1 text-body-sans font-medium">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="break-words text-body-serif">
                          {link.title}
                        </span>
                        <span className="w-full break-words text-mono-s [overflow-wrap:anywhere]">
                          {link.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
