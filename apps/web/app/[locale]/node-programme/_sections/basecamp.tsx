import type { NodeProgrammeCopySection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { BasecampDownloadLink } from '@/components/sections/basecamp/_sections/basecamp-download-link'
import { Button, ButtonArrowIcon } from '@/components/ui'
import basecampRelease from '@/lib/data/basecamp-release.snapshot.json'

interface NodeProgrammeBasecampProps {
  data: NodeProgrammeCopySection['basecamp']
}

export function NodeProgrammeBasecamp({ data }: NodeProgrammeBasecampProps) {
  return (
    <section
      className="py-16 md:py-25 lg:min-h-[894px]"
      aria-labelledby="node-programme-basecamp"
    >
      <ContentWidth>
        <h2
          id="node-programme-basecamp"
          className="text-h1 whitespace-pre-line"
        >
          {data.title}
        </h2>
        <div className="mt-10 max-w-[702px] md:mt-15">
          <p className="max-w-[560px] font-sans text-lg leading-[1.15] tracking-[-0.01em]">
            {data.body}
          </p>
          <p className="mt-6 font-sans text-2xl leading-[1.1] tracking-[-0.01em]">
            {data.privacy}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <BasecampDownloadLink
              cta={data.installCta}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-dark-green px-3 py-2 font-mono text-xs leading-[1.35] font-semibold text-brand-off-white uppercase transition-colors hover:bg-accent-steel-teal focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {data.installCta.label}
              <ButtonArrowIcon />
            </BasecampDownloadLink>
            <Button
              href={data.versionsCta.href}
              variant="tertiary"
              className="cursor-pointer"
            >
              {data.versionsCta.label}
            </Button>
            <Button
              href={data.guideCta.href}
              variant="tertiary"
              className="cursor-pointer"
            >
              {data.guideCta.label}
            </Button>
          </div>
          <p className="mt-6 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] leading-[1.3] text-brand-dark-green/70">
            <span>{data.platforms}</span>
            <span>
              {data.versionLabel.replace(
                '{version}',
                basecampRelease.tag.replace(/^v/, '')
              )}
            </span>
            <span>{data.testnetLabel}</span>
          </p>
        </div>
      </ContentWidth>
    </section>
  )
}
