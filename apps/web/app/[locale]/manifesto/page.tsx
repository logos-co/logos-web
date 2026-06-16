import type { CSSProperties } from 'react'

import { getTranslations } from 'next-intl/server'

import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'

const PARAGRAPH_TOPS = [
  0, 174, 324, 474, 648, 798, 924, 1074, 1176, 1302, 1428, 1506, 1608, 1710,
  1812, 1890, 1968, 2070, 2196, 2322, 2400, 2454, 2508, 2562, 2616, 2670, 2748,
  2826, 2904,
] as const
const DESKTOP_WORD_SPACING_PARAGRAPH_INDEXES = new Set([11])

type ManifestoCopy = {
  author: string[]
  body: string[]
  more: string[]
}

const DESKTOP_PARAGRAPH_STYLE = (index: number): CSSProperties => ({
  top: PARAGRAPH_TOPS[index],
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pages.manifesto' })

  return createDefaultMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: ROUTES.manifesto,
  })
}

export default async function ManifestoPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pages.manifesto' })
  const copy: ManifestoCopy = {
    author: t.raw('author') as string[],
    body: t.raw('body') as string[],
    more: t.raw('more') as string[],
  }

  return (
    <div className="overflow-x-hidden bg-brand-off-white text-brand-dark-green desktop:h-[4669px] desktop:overflow-hidden">
      <section className="relative flex flex-col items-center justify-center px-3 pt-28 pb-28 desktop:block desktop:h-[697px] desktop:p-0">
        <h1 className="font-display mx-auto w-full max-w-[352px] text-center text-[24px] leading-none tracking-[-0.03em] min-[768px]:max-[1439px]:max-w-[620px] min-[768px]:max-[1439px]:text-[44px] min-[768px]:max-[1439px]:leading-[0.95] desktop:absolute desktop:top-[175px] desktop:left-1/2 desktop:w-[1178px] desktop:max-w-none desktop:-translate-x-1/2 desktop:text-[96px] desktop:leading-[0.98] desktop:tracking-[-0.04em]">
          <span className="desktop:hidden">{t('heading')}</span>
          <span className="hidden desktop:block">
            <span className="block">{t('headingLine1')}</span>
            <span className="block">{t('headingLine2')}</span>
          </span>
        </h1>
        <p className="font-mono-body mx-auto mt-6 w-[102px] text-center text-[10px] leading-[1.3] tracking-[0px] desktop:absolute desktop:top-[426px] desktop:left-1/2 desktop:mt-0 desktop:-translate-x-1/2">
          {copy.author.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </section>

      <section className="relative desktop:h-[3972px]">
        <div
          data-manifesto-dark
          className="bg-brand-dark-green px-3 py-28 text-brand-off-white desktop:absolute desktop:top-0 desktop:left-0 desktop:h-[770px] desktop:w-full desktop:rounded-t-[100px] desktop:p-0"
        >
          <div className="mx-auto max-w-[698px] desktop:absolute desktop:top-[94px] desktop:left-1/2 desktop:h-[464px] desktop:w-[698px] desktop:-translate-x-1/2">
            <section className="desktop:contents">
              <h2 className="font-display text-center text-[24px] leading-none tracking-[-0.03em] min-[768px]:max-[1439px]:text-[36px] desktop:absolute desktop:top-0 desktop:left-[73px] desktop:w-[552px] desktop:text-[36px]">
                {t('abstractHeading')}
              </h2>
              <p className="font-display mt-6 text-center text-[14px] leading-[1.2] tracking-[0px] [overflow-wrap:anywhere] min-[768px]:max-[1439px]:text-[20px] min-[768px]:max-[1439px]:leading-[24px] min-[768px]:max-[1439px]:[overflow-wrap:normal] desktop:absolute desktop:top-[50px] desktop:left-0 desktop:mt-0 desktop:w-[698px] desktop:text-justify desktop:text-[20px] desktop:leading-[24px] desktop:tracking-[-0.03em] desktop:[overflow-wrap:normal]">
                {t('abstractBody')}
              </p>
            </section>
            <section className="hidden desktop:contents">
              <h2 className="font-display text-center text-[24px] leading-none tracking-[-0.03em] min-[768px]:max-[1439px]:text-[36px] desktop:absolute desktop:top-[376px] desktop:left-[73px] desktop:w-[552px] desktop:text-[36px]">
                {t('keywordsHeading')}
              </h2>
              <p className="font-display mt-6 text-center text-[14px] leading-[1.2] tracking-[0px] [overflow-wrap:anywhere] min-[768px]:max-[1439px]:text-[20px] min-[768px]:max-[1439px]:leading-[24px] min-[768px]:max-[1439px]:[overflow-wrap:normal] desktop:absolute desktop:top-[426px] desktop:left-0 desktop:mt-0 desktop:w-[698px] desktop:text-justify desktop:text-[20px] desktop:leading-[24px] desktop:tracking-[-0.03em] desktop:[overflow-wrap:normal]">
                {t('keywords')}
              </p>
            </section>
          </div>
        </div>

        <div
          data-manifesto-paper
          className="bg-brand-off-white px-3 pt-28 pb-28 desktop:absolute desktop:top-[670px] desktop:left-0 desktop:h-[3190px] desktop:w-full desktop:rounded-[100px] desktop:p-0"
        >
          <article className="font-sans mx-auto max-w-[366px] text-center text-[14px] leading-[1.2] tracking-[0px] min-[768px]:max-[1439px]:max-w-[640px] min-[768px]:max-[1439px]:text-[18px] min-[768px]:max-[1439px]:leading-[21.6px] desktop:absolute desktop:top-[107px] desktop:left-1/2 desktop:h-[3078px] desktop:w-[853px] desktop:max-w-none desktop:-translate-x-1/2 desktop:font-article desktop:text-[20px] desktop:leading-[24px] desktop:tracking-[-0.03em]">
            <div className="desktop:relative desktop:h-[2918px]">
              {copy.body.map((paragraph, index) => (
                <p
                  key={paragraph}
                  style={DESKTOP_PARAGRAPH_STYLE(index)}
                  className={`mb-10 [overflow-wrap:anywhere] desktop:absolute desktop:left-0 desktop:mb-0 desktop:w-full desktop:text-justify desktop:[overflow-wrap:normal] ${
                    DESKTOP_WORD_SPACING_PARAGRAPH_INDEXES.has(index)
                      ? 'desktop:[word-spacing:0.2px]'
                      : ''
                  }`}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <aside className="font-mono-body mt-12 text-[10px] leading-[1.3] tracking-[0px] desktop:absolute desktop:top-[2995px] desktop:left-0 desktop:mt-0 desktop:h-[88px] desktop:w-[306px] desktop:text-left">
              <h2 className="font-bold">{t('moreHeading')}</h2>
              <div className="mt-3 space-y-3 desktop:mt-[12px] desktop:space-y-[12px]">
                {copy.more.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </aside>
          </article>
        </div>
      </section>
    </div>
  )
}
