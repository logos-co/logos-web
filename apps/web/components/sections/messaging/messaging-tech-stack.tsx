import type { Language } from '@repo/content/schemas'

import TechStackExplorer from '@/components/sections/shared/tech-stack-explorer'

export default function MessagingTechStack({ locale }: { locale: Language }) {
  return (
    <div className="md:mb-25">
      <TechStackExplorer locale={locale} contentClassName="pb-18 md:pb-6" />
    </div>
  )
}
