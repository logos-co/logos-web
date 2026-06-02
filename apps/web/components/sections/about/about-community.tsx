import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

/**
 * About — global community block. World-map illustration in a rounded panel
 * on the left, eyebrow + serif H3 + "Join a circle" CTA on the right.
 *
 * Figma desktop 40009046:27252 (h 661); mobile stacks vertically.
 */
export async function AboutCommunity() {
  const t = await getTranslations('pages.about.community')

  return (
    <section className="bg-brand-off-white">
      <div className="px-3 pt-3 pb-0 md:hidden">
        <div className="relative aspect-[369/536] w-full overflow-hidden rounded-[100px] bg-gray-01">
          <Image
            src="/images/about/map.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover mix-blend-multiply"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 px-3 pt-10 pb-25 text-center md:hidden">
        <p className="text-eyebrow text-brand-dark-green">{t('eyebrow')}</p>
        <p className="text-h3-serif text-brand-dark-green">{t('body')}</p>
        <Button href={ROUTES.circles} variant="primary">
          {t('cta')}
        </Button>
      </div>

      <ContentWidth className="hidden h-[661px] grid-cols-12 gap-3 px-3 py-25 md:grid">
        <div className="relative col-span-8 h-[461px] overflow-hidden rounded-[100px] bg-gray-01">
          <Image
            src="/images/about/map.webp"
            alt=""
            fill
            sizes="940px"
            className="object-cover mix-blend-multiply"
          />
        </div>

        <div className="col-span-4 col-start-9 flex max-w-[464px] flex-col gap-6 self-center">
          <p className="text-eyebrow text-brand-dark-green">{t('eyebrow')}</p>
          <p className="text-h3-serif text-brand-dark-green">{t('body')}</p>
          <Button
            href={ROUTES.circles}
            variant="primary"
            className="self-start"
          >
            {t('cta')}
          </Button>
        </div>
      </ContentWidth>
    </section>
  )
}
