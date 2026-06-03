import type { Language } from '@repo/content/schemas'

import TechStackExplorer from '@/components/sections/shared/tech-stack-explorer'

export default function StorageTechStack({ locale }: { locale: Language }) {
  return <TechStackExplorer locale={locale} contentClassName="pb-18 md:pb-6" />
}
