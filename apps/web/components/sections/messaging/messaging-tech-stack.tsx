import type { Language } from '@repo/content/schemas'

import TechStackExplorer from '@/components/sections/shared/tech-stack-explorer'

export default function MessagingTechStack({ locale }: { locale: Language }) {
  return (
    <div className="md:mb-[100px]">
      <TechStackExplorer locale={locale} />
    </div>
  )
}
