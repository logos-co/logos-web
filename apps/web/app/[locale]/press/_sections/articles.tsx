/**
 * Article sections used by the `/press` page: hero, list rows, gallery,
 * and the full-bleed featured spread.
 */
import Image from 'next/image'

import type { PressArticleRow } from '@/lib/press-engine'

import {
  Dot,
  PressRowLink,
  RowThumbnail,
  TextLink,
  UnderlineLabel,
} from './press-atoms'

const PRESS_HERO_IMAGE = '/images/press-engine/press-hero.jpg'

export function PressHero({ lead }: { lead: PressArticleRow }) {
  return (
    <section className="h-[374px] bg-accent-tan px-3 pt-6 md:h-[342px] md:pb-[100px]">
      <div className="mx-auto flex w-full max-w-[370px] flex-col gap-[100px] md:max-w-[1416px] md:gap-10">
        <div className="relative h-[81px] w-full md:w-[1186px]">
          <div className="absolute left-0 top-0 aspect-video w-[107px] overflow-hidden">
            <Image
              src={PRESS_HERO_IMAGE}
              alt=""
              width={107}
              height={60}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <p className="text-mono-s absolute left-[191px] top-0 w-[179px] text-brand-dark-green md:left-[714px] md:w-[226px]">
            {lead.description || lead.title}
          </p>
        </div>
        <h1 className="font-display text-center text-[40px] leading-none tracking-[-0.03em] text-brand-dark-green md:text-[56px] md:tracking-normal">
          <span className="block">The Logos</span>
          <span className="block">Press Engine</span>
        </h1>
      </div>
    </section>
  )
}

export function ArticleEntry({
  article,
  index,
}: {
  article: PressArticleRow
  index: number
}) {
  const titleRest = article.titleSerif
    ? article.title.replace(article.titleSerif, '').trim()
    : article.title

  return (
    <PressRowLink
      href={article.href}
      index={index}
      className="h-[158px] md:h-[158px]"
    >
      <RowThumbnail
        src={article.image}
        className="left-3 top-3 w-[107px] md:block"
      />
      <div className="absolute left-[119px] top-0 flex h-full w-[274px] flex-col justify-center gap-1.5 py-3 pl-3 md:left-[119px] md:grid md:w-[1150px] md:grid-cols-[595px_345px_1fr] md:gap-x-3 md:p-0">
        <div className="flex flex-col justify-center gap-1.5 md:justify-start md:py-3 md:pl-3">
          <div className="text-mono-s flex items-center gap-2.5 text-brand-dark-green">
            <span>{article.date}</span>
            <Dot />
            <span>{article.author}</span>
          </div>
          <div className="w-[250px] text-[18px] leading-[1.15] tracking-[-0.01em] text-brand-dark-green md:w-full md:max-w-[333px] md:tracking-normal">
            {article.titleSerif ? (
              <>
                <span className="font-display block leading-[1.1]">
                  {article.titleSerif}
                </span>
                <span className="font-sans block">{titleRest}</span>
              </>
            ) : (
              <span className="font-sans">{article.title}</span>
            )}
          </div>
        </div>
        <p className="text-mono-s hidden max-w-[345px] text-brand-dark-green md:block md:py-3">
          {article.description}
        </p>
        <div className="hidden md:block md:py-3">
          <UnderlineLabel>{article.readingTime} min read</UnderlineLabel>
        </div>
      </div>
    </PressRowLink>
  )
}

export function GallerySection({ articles }: { articles: PressArticleRow[] }) {
  return (
    <section className="h-[319px] overflow-x-auto overflow-y-hidden bg-accent-tan md:h-auto md:overflow-visible md:px-3 md:py-10">
      <div className="flex w-max gap-3 py-10 pl-3 pr-3 md:grid md:w-auto md:grid-cols-4 md:p-0">
        {articles.map((article) => (
          <a
            key={article.title}
            href={article.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-[339px] shrink-0 flex-col gap-1.5 text-brand-dark-green md:w-auto"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-brand-dark-green/10">
              <Image
                src={article.image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 345px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="flex items-baseline justify-between gap-6">
              <p className="max-w-[170px] font-sans text-[12px] font-medium leading-[1.2] tracking-normal md:text-[14px]">
                {article.title}
              </p>
              <div className="text-mono-s shrink-0 text-brand-dark-green md:text-right">
                <p>{article.galleryDate}</p>
                <p>{article.author}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

export function FeaturedArticle({ article }: { article: PressArticleRow }) {
  return (
    <section className="relative h-[994px] overflow-hidden bg-accent-tan md:flex md:h-[1044px] md:justify-center md:gap-3 md:overflow-visible md:pr-3">
      <div className="absolute left-0 top-0 z-10 h-[313px] w-full px-3 pt-10 md:sticky md:top-10 md:h-[495px] md:flex-1 md:pl-[129px] md:pt-[100px]">
        <div className="flex max-w-[573px] flex-col gap-6 md:gap-[30px]">
          <div className="text-mono-s flex items-center gap-2.5 text-brand-off-white md:text-brand-dark-green">
            <span>{article.author}</span>
            <Dot className="bg-brand-off-white md:bg-brand-dark-green" />
            <span>{article.date}</span>
          </div>
          <h2 className="font-display max-w-[370px] text-[40px] leading-none tracking-[-0.03em] text-brand-off-white md:max-w-[464px] md:text-[56px] md:tracking-normal md:text-brand-dark-green">
            {article.title}
          </h2>
          <div className="flex flex-col gap-5">
            <p className="text-mono-s max-w-[370px] text-brand-off-white md:max-w-[456px] md:text-brand-dark-green">
              {article.description}
            </p>
            <TextLink
              href={article.href}
              label={`Read ${article.title}`}
              tone="light"
              className="md:text-brand-dark-green md:decoration-brand-dark-green/50"
            >
              Read Article
            </TextLink>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 h-[994px] overflow-hidden md:relative md:inset-auto md:h-[994px] md:w-[714px] md:shrink-0">
        <Image
          src={article.image}
          alt=""
          width={1242}
          height={994}
          className="absolute left-[-303px] top-0 h-[1040px] w-[1300px] max-w-none object-cover md:left-[-104px] md:h-full md:w-[1242px]"
        />
      </div>
    </section>
  )
}
