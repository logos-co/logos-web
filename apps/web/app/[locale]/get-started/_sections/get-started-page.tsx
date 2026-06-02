import { Build } from './build'
import { Community } from './community'
import { Docs } from './docs'
import { Hero } from './hero'
import { Install } from './install'
import type { GetStartedTranslator } from './types'

export function GetStartedPage({ t }: { t: GetStartedTranslator }) {
  return (
    <div className="bg-brand-off-white text-brand-dark-green">
      <Hero heading={t('heading')} intro={t('intro')} />
      <Install t={t} />
      <Docs t={t} />
      <Community t={t} />
      <Build t={t} />
    </div>
  )
}
