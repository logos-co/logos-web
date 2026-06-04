import type { BuilderHubSettings } from '@repo/content/schemas'

import { BasecampInstallSection } from '@/components/sections/shared/basecamp-install-section'

import type { GetStartedTranslator } from './types'

export function Install({
  t,
  data,
}: {
  t: GetStartedTranslator
  data: NonNullable<BuilderHubSettings['prepare']>
}) {
  return (
    <BasecampInstallSection
      id="install"
      index={t('sections.install.number')}
      title={t('sections.install.heading')}
      cards={data.cards}
    />
  )
}
