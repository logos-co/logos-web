import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import { CaseStudyMotion } from '@/components/case-study-motion'
import { createPageMetadata } from '@/lib/page-metadata'

import { Cover } from './_sections/cover'
import { Story } from './_sections/story'
import { Projects } from './_sections/projects'
import { Technology } from './_sections/technology'
import { BuildAndClosing } from './_sections/build-and-closing'
import '../muster/muster-motion.css'
import './field-station-case-study.css'
import './field-station-motion.css'
import './field-station-interactions.css'

export const generateMetadata = createPageMetadata(ROUTES.fieldStationCaseStudy)

export default async function FieldStationCaseStudyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale))
    throw new Error(`Unsupported Field Station locale "${locale}"`)
  const page = await getPageCopy(ROUTES.fieldStationCaseStudy, locale)
  const copy = page.sections.find(
    (section) => section.componentType === 'fieldStationCaseStudyCopy'
  )
  if (!copy) throw new Error('Missing Field Station case study copy')

  return (
    <CaseStudyMotion className="field-case" revealContent>
      <Cover hero={copy.hero} intro={copy.intro} />
      <Story basics={copy.basics} community={copy.community} />
      <Projects
        copy={copy.projects}
        testimonial={copy.testimonial}
        next={copy.next}
      />
      <Technology modules={copy.modules} architecture={copy.architecture} />
      <BuildAndClosing
        build={copy.build}
        closing={copy.closing}
        fieldStationCta={copy.intro.fieldStationCta}
      />
    </CaseStudyMotion>
  )
}
