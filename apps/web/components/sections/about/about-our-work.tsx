import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

/**
 * About — "Our Work" section. Top intro row (mark + body + "All Case Studies"
 * link), large centered "Our Work" h2, then two side-by-side case-study
 * cards.
 *
 * Figma desktop 40009046:27358 (mobile collapses to a vertical card stack).
 */
export async function AboutOurWork() {
  const t = await getTranslations('pages.about.ourWork')

  return (
    <section className="bg-brand-off-white pt-6 pb-24 md:pt-6 md:pb-25">
      <ContentWidth className="flex flex-col items-center gap-10 px-3 md:gap-25">
          <div className="flex w-full flex-col gap-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-[131px]">
              <div className="relative h-[81px] w-[107px] shrink-0 overflow-hidden">
                <Image
                  src="/images/about/work-mark.webp"
                  alt=""
                  fill
                  sizes="107px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-[131px]">
                <p className="text-mono-s text-brand-dark-green md:max-w-[226px]">
                  {t('body')}
                </p>
                <Button href={ROUTES.press} variant="link" className="self-start">
                  {t('ctaAll')}
                </Button>
              </div>
            </div>

            <h2 className="text-h2 text-brand-dark-green text-center">
              {t('title')}
            </h2>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
            <Card
              eyebrow={t('cardEyebrow')}
              title={t('card1Title')}
              body={t('cardBody')}
              cta={t('cardCta')}
              image="/images/about/case-1.webp"
              imageRatio="4/5"
            />
            <Card
              eyebrow={t('cardEyebrow')}
              title={t('card2Title')}
              body={t('cardBody')}
              cta={t('cardCta')}
              image="/images/about/case-2.webp"
              imageRatio="5/4"
            />
          </div>
      </ContentWidth>
    </section>
  )
}

type CardProps = {
  eyebrow: string
  title: string
  body: string
  cta: string
  image: string
  imageRatio: '4/5' | '5/4'
}

/*
 * Literal class strings so Tailwind's compiler can see them in source — a
 * runtime-built `md:${imageRatio}` is never emitted by the JIT, which silently
 * dropped the desktop aspect ratio.
 */
const DESKTOP_IMAGE_RATIO: Record<CardProps['imageRatio'], string> = {
  '4/5': 'md:aspect-[4/5]',
  '5/4': 'md:aspect-[5/4]',
}

function Card({ eyebrow, title, body, cta, image, imageRatio }: CardProps) {
  return (
    <article className="relative flex h-[299px] flex-col overflow-hidden rounded-[12px] border border-brand-dark-green/50 p-[11px] md:h-[406px]">
      <header className="flex items-center gap-3">
        <LogosMark size={10} className="text-brand-dark-green" />
        <p className="text-eyebrow text-brand-dark-green">{eyebrow}</p>
      </header>

      <div className="mt-auto flex flex-col gap-6">
        <h3 className="text-subhead-sans max-w-[185px] text-brand-dark-green md:max-w-[228px]">
          {title}
        </h3>
        <p className="text-mono-s whitespace-pre-line text-brand-dark-green">
          {body}
        </p>
      </div>

      <div
        className={`absolute top-[11px] right-[11px] h-[120px] w-[96px] overflow-hidden md:top-auto md:bottom-[11px] md:h-auto ${DESKTOP_IMAGE_RATIO[imageRatio]}`}
      >
        <Image src={image} alt="" fill sizes="96px" className="object-cover" />
      </div>

      <Button
        href={ROUTES.press}
        variant="primary"
        className="absolute top-[11px] right-[11px] hidden md:inline-flex"
      >
        {cta}
      </Button>
    </article>
  )
}
