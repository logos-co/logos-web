import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'

import {
  APPLICATION,
  APPLICATION_INTRO,
  APPLICATION_STEP_4,
  EVENT_NAMES,
  SECTION_IDS,
} from '../_content'
import { LinkedText } from './atoms'
import { BasecampInstallButton } from './basecamp-install-button'

const ROW_DESCRIPTIONS = {
  [APPLICATION_STEP_4.number]: (
    <LinkedText text={APPLICATION_STEP_4.text} link={APPLICATION_STEP_4.link} />
  ),
}

/**
 * The Basecamp "How it works" block at Figma's 702/702 split. The photo keeps
 * the 702×626 frame ratio and the grid row stretches the copy column to it.
 */
export function Application() {
  return (
    <ContentWidth
      id={SECTION_IDS.applicationProcess}
      className="mt-28 scroll-mt-12 !p-0"
    >
      <section className="grid w-full gap-6 px-3 py-10 lg:grid-cols-2 lg:gap-3 lg:p-3">
        <div className="flex flex-col gap-6 lg:justify-between lg:gap-8">
          <div>
            <h2 className="text-h3-sans mb-[15px] text-brand-dark-green">
              {APPLICATION.title}
            </h2>
            <div className="mb-[42px] flex flex-col gap-[42px] text-brand-dark-green">
              <p className="text-body-lg-sans max-w-[612px]">
                {APPLICATION_INTRO.bodyLines.map((line, index) => (
                  <span key={line}>
                    {index > 0 ? (
                      <>
                        <span className="desktop:hidden"> </span>
                        <br className="hidden desktop:inline" />
                      </>
                    ) : null}
                    {line}
                  </span>
                ))}
              </p>
              <p className="text-mono-s">
                <LinkedText {...APPLICATION_INTRO.note} />
              </p>
            </div>
            <div className="divide-y divide-brand-dark-green/50 border-t border-brand-dark-green/50">
              {APPLICATION.rows.map((row) => (
                <article
                  key={row.number}
                  className="grid gap-4 pt-[5px] pb-3 lg:grid-cols-2 lg:gap-3"
                >
                  <span className="text-eyebrow text-brand-dark-green">
                    {row.number}
                  </span>
                  <div className="grid gap-2">
                    <p className="text-mono-s text-brand-dark-green">
                      {ROW_DESCRIPTIONS[row.number ?? ''] ?? row.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-1">
            <Button
              href={APPLICATION.action!.href}
              variant="secondary"
              className="cursor-pointer"
              data-umami-event-name={EVENT_NAMES.applicationApply}
            >
              {APPLICATION.action!.label}
            </Button>
            <BasecampInstallButton />
          </div>
        </div>
        <div className="relative aspect-[702/626] overflow-hidden rounded-xl">
          <Image
            src={APPLICATION_INTRO.image.src}
            alt={APPLICATION_INTRO.image.alt}
            fill
            priority
            sizes="(max-width: 1024px) calc(100vw - 24px), (max-width: 1440px) calc(50vw - 24px), 696px"
            className="object-cover"
          />
        </div>
      </section>
    </ContentWidth>
  )
}
