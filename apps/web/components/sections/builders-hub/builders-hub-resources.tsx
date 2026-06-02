import type { BuilderResource } from '@repo/content/loaders'
import type { BuilderHubSettings } from '@repo/content/schemas'

import { Link } from '@/i18n/navigation'

import { BuildersHubSectionHeader } from './section-header'

type Props = {
  settings: BuilderHubSettings['resourcesSection']
  resources: BuilderResource[]
}

/**
 * Additional Resources table (Figma 40009046:24171 desktop, 40009046:23919
 * mobile). Header + N rows; each row is `index + title` on the left and a
 * single CTA on the right. Same alternating-row background as Overview Links
 * and Ideas sections.
 */
export function BuildersHubResources({ settings, resources }: Props) {
  return (
    <section className="border-t border-brand-dark-green/10 bg-brand-off-white">
      <div className="mx-auto max-w-360 px-3 pt-10 pb-12">
        <BuildersHubSectionHeader
          title={settings.title}
          eyebrow={settings.description}
          topRightCta={settings.helpCenterCta}
        />

        <ul className="mt-[77px] w-full">
          {resources.map((resource, index) => (
            <ResourceRow
              key={resource.slug}
              index={index + 1}
              resource={resource}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}

function ResourceRow({
  index,
  resource,
}: {
  index: number
  resource: BuilderResource
}) {
  const indexLabel = index.toString().padStart(2, '0')
  const isOdd = index % 2 === 1
  const bg = isOdd ? 'bg-gray-01' : 'bg-brand-dark-green/5'
  const isExternal = /^https?:\/\//.test(resource.href)

  return (
    <li className={`${bg} relative w-full`}>
      <Link
        href={resource.href}
        className="group block transition-colors hover:bg-brand-dark-green/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-dark-green"
        {...(isExternal
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {/* Mobile: 58 px */}
        <div className="relative h-[58px] md:hidden">
          <p className="absolute top-3 left-3 font-sans text-[14px] leading-[1.2] text-brand-dark-green">
            <span className="font-medium">{indexLabel}</span>
            <span className="ml-3 font-display">{resource.title}</span>
          </p>
          <span className="absolute top-3 right-3 inline-flex items-center justify-center text-brand-dark-green">
            <span className="font-mono text-[10px] leading-[1.35] font-semibold uppercase whitespace-nowrap border-b border-brand-dark-green/50 pb-0.5">
              {resource.ctaLabel}
            </span>
          </span>
        </div>

        {/* Desktop: 50 px */}
        <div className="relative hidden h-[50px] md:block">
          <div className="absolute top-3 left-3 flex items-baseline gap-3">
            <span className="font-sans text-[14px] font-medium leading-[1.2] text-brand-dark-green w-[18px]">
              {indexLabel}
            </span>
            <span className="font-display text-[14px] leading-[1.2] text-brand-dark-green whitespace-nowrap">
              {resource.title}
            </span>
          </div>
          <p className="absolute top-3 left-[50%] translate-x-[6px] w-[312px] font-mono text-[10px] leading-[1.3] text-brand-dark-green">
            {resource.description}
          </p>
          <span className="absolute top-3 left-[83.33%] translate-x-[2px] inline-flex items-center justify-center text-brand-dark-green">
            <span className="font-mono text-[10px] leading-[1.35] font-semibold uppercase whitespace-nowrap border-b border-brand-dark-green/50 pb-0.5">
              {resource.ctaLabel}
            </span>
          </span>
        </div>
      </Link>
    </li>
  )
}
