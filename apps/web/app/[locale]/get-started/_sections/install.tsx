import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'
import { ROUTES } from '@/constants/routes'

import { ActionLink, SectionHeading } from './atoms'
import type { GetStartedTranslator } from './types'

export function Install({ t }: { t: GetStartedTranslator }) {
  return (
    <section
      id="install"
      className="border-t border-brand-dark-green/10 pt-6 pb-25"
    >
      <ContentWidth className="flex w-full flex-col gap-10">
        <SectionHeading
          number={t('sections.install.number')}
          heading={t('sections.install.heading')}
        />
        <div className="grid gap-1.5 overflow-hidden rounded-xl bg-gray-01 p-1.5 md:min-h-[325px] md:grid-cols-2">
          <div className="relative min-h-[314px] overflow-hidden rounded-md md:min-h-full">
            <Image
              src="/images/builders-hub/basecamp-card.png"
              alt={t('sections.install.imageAlt')}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 690px"
              className="object-cover object-left"
            />
          </div>
          <div className="flex min-h-[227px] flex-col items-center justify-center gap-6 px-6 py-10 text-center md:min-h-full">
            <div className="flex max-w-[345px] flex-col items-center gap-3">
              <h3 className="font-sans text-[18px] leading-[1.15] tracking-[-0.18px]">
                {t('sections.install.cardTitle')}
              </h3>
              <p className="font-mono text-[10px] leading-[1.3]">
                {t('sections.install.body')}
              </p>
            </div>
            <ActionLink href={ROUTES.basecamp}>
              {t('sections.install.cta')}
            </ActionLink>
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}
