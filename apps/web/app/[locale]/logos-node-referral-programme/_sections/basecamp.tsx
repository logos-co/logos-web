import Image from 'next/image'
import type { NodeReferralProgrammeCopySection } from '@repo/content/schemas'

import { ProgrammeWidth } from './layout'
import { ProgrammeButton } from './button'
import { InstallButton } from './install-button'
import basecampRelease from '@/lib/data/basecamp-release.snapshot.json'

interface NodeProgrammeBasecampProps {
  data: NodeReferralProgrammeCopySection['basecamp']
}

export function NodeProgrammeBasecamp({ data }: NodeProgrammeBasecampProps) {
  return (
    <section
      className="py-16 md:py-25 lg:min-h-[894px]"
      aria-labelledby="node-programme-basecamp"
    >
      <ProgrammeWidth className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-6">
        <div className="min-w-0">
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
              <InstallButton cta={data.installCta} />
              <ProgrammeButton
                href={data.versionsCta.href}
                variant="tertiary"
                className="cursor-pointer"
              >
                {data.versionsCta.label}
              </ProgrammeButton>
              <ProgrammeButton
                href={data.guideCta.href}
                variant="tertiary"
                className="cursor-pointer"
              >
                {data.guideCta.label}
              </ProgrammeButton>
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
        </div>
        <figure
          className="mx-auto w-full max-w-[764px] lg:mt-1 lg:mr-0"
          data-case-study-reveal
        >
          <Image
            src={data.image.src}
            alt={data.image.alt}
            width={764}
            height={560}
            sizes="(min-width: 1440px) 764px, (min-width: 1024px) 55vw, calc(100vw - 24px)"
            loading="lazy"
            className="h-auto w-full rounded-[16px] shadow-[0_30px_60px_rgba(0,0,0,0.45)]"
          />
        </figure>
      </ProgrammeWidth>
    </section>
  )
}
