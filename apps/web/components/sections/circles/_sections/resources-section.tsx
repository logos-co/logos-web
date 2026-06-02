import { type CircleResource } from '@repo/content/loaders'
import type { CirclesSettings } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'

import { isExternalHref, SmartLink } from '../_helpers'
import { SectionIntro } from './atoms'

export function ResourcesSection({
  settings,
  resources,
}: {
  settings: CirclesSettings
  resources: CircleResource[]
}) {
  return (
    <section
      id="resources"
      className="border-t border-brand-dark-green/10 bg-brand-off-white pb-15"
    >
      <SectionIntro
        title={settings.resourcesSection.title}
        description={settings.resourcesSection.description}
        cta={settings.resourcesSection.helpCenterCta}
      />

      <ContentWidth>
        <ul className="w-full">
          {resources.map((resource, index) => (
          <li key={resource.slug}>
            <SmartLink
              href={resource.href}
              className={`grid min-h-[58px] grid-cols-[minmax(0,1fr)_83px] items-center gap-3 px-3 py-3 text-brand-dark-green transition-colors hover:bg-brand-dark-green/10 md:min-h-[50px] md:grid-cols-12 md:items-start ${
                index % 2 === 0 ? 'bg-gray-01' : 'bg-brand-dark-green/5'
              }`}
              target={isExternalHref(resource.href) ? '_blank' : undefined}
              rel={
                isExternalHref(resource.href)
                  ? 'noopener noreferrer'
                  : undefined
              }
            >
              <div className="flex gap-3 md:col-span-4">
                <span className="w-[26px] font-sans text-[14px] font-medium leading-[1.2]">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <span className="font-display text-[14px] leading-[1.2]">
                  {resource.title}
                </span>
              </div>
              <p className="text-mono-s hidden md:col-span-4 md:col-start-7 md:block md:w-[312px]">
                {resource.description}
              </p>
              <span className="text-eyebrow w-fit justify-self-end border-b border-brand-dark-green/50 md:col-span-2 md:col-start-11 md:justify-self-start">
                {resource.ctaLabel}
              </span>
            </SmartLink>
          </li>
        ))}
        </ul>
      </ContentWidth>
    </section>
  )
}
