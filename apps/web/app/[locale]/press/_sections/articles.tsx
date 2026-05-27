/**
 * Article sections used by the `/press` page: hero, list rows, gallery,
 * and the full-bleed featured spread.
 */
import Image from 'next/image'
import { LogosMark } from '@acid-info/logos-ui'

import { ExternalLink } from '@/components/ui'
import { Link } from '@/i18n/navigation'
import type { PressArticleRow } from '@/lib/press-engine'

import {
  ArrowIcon,
  Dot,
  PlayIcon,
  PressRowLink,
  RowThumbnail,
  SectionCta,
  TextLink,
  UnderlineLabel,
} from './press-atoms'

const PRESS_HERO_IMAGE = '/images/press-engine/press-hero.jpg'
const BROADCAST_BACKGROUND_IMAGE =
  '/images/press-engine/broadcast-network-bg.webp'

export interface PressCopy {
  heroHeading: string
  heroHeadingLine1: string
  heroHeadingLine2: string
  navLabel: string
  navArticles: string
  navPodcasts: string
  navBroadcast: string
  navBroadcastHref: string
  articlesHeading: string
  readArticle: string
  seeMoreArticles: string
  broadcastHeading: string
  broadcastDescription: string
  media: string
  latestEpisode: string
  broadcastCta: string
}

export function PressHero({
  lead,
  copy,
}: {
  lead: PressArticleRow
  copy: Pick<
    PressCopy,
    | 'heroHeadingLine1'
    | 'heroHeadingLine2'
    | 'navLabel'
    | 'navArticles'
    | 'navPodcasts'
    | 'navBroadcast'
    | 'navBroadcastHref'
  >
}) {
  return (
    <section className="relative h-[473px] bg-accent-tan px-3 pt-6 md:h-[359px] md:pt-6">
      <div className="flex w-full flex-col gap-[100px] md:gap-10">
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
        <h1 className="font-display text-center text-[40px] leading-none tracking-[-0.03em] text-brand-dark-green md:text-[56px]">
          <span className="block">{copy.heroHeadingLine1}</span>
          <span className="block">{copy.heroHeadingLine2}</span>
        </h1>
      </div>
      <nav
        aria-label={copy.navLabel}
        className="absolute left-[calc(50%+6px)] top-[334px] flex flex-col items-start gap-2 text-brand-dark-green md:top-[342px] md:flex-row md:items-center md:gap-6"
      >
        {[
          { href: '#articles', label: copy.navArticles },
          { href: '#podcasts', label: copy.navPodcasts },
        ].map((item) => {
          const className =
            'inline-flex cursor-pointer items-center gap-1 font-mono text-[10px] font-semibold uppercase leading-[1.35] transition-opacity hover:opacity-70'

          return (
            <a key={item.href} href={item.href} className={className}>
              <ArrowIcon direction="down" />
              {item.label}
            </a>
          )
        })}
        <Link
          href={copy.navBroadcastHref}
          className="inline-flex cursor-pointer items-center gap-1 font-mono text-[10px] font-semibold uppercase leading-[1.35] transition-opacity hover:opacity-70"
        >
          <ArrowIcon direction="down" />
          {copy.navBroadcast}
        </Link>
      </nav>
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
    <PressRowLink href={article.href} index={index} className="h-[107px]">
      <RowThumbnail
        src={article.thumbnailImage}
        className="left-3 top-[15px] w-[107px] md:block"
      />
      <div className="absolute left-[119px] top-0 flex h-full w-[274px] flex-col justify-center gap-1.5 py-3 pl-3 md:left-[119px] md:grid md:w-[1150px] md:grid-cols-[595px_543px] md:gap-x-3 md:p-0">
        <div className="flex flex-col justify-center gap-1.5 md:py-3 md:pl-3">
          <div className="text-mono-s flex items-center gap-2.5 text-brand-dark-green">
            <span>{article.date}</span>
            <Dot />
            <span>{article.author}</span>
          </div>
          <div className="w-[250px] text-[18px] leading-[1.15] tracking-[-0.01em] text-brand-dark-green md:w-full md:max-w-[333px]">
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
        <div className="hidden md:flex md:items-start md:gap-[132px]">
          <p className="text-mono-s w-[345px] py-3 text-brand-dark-green">
            {article.description}
          </p>
          <div className="shrink-0 py-3">
            <UnderlineLabel>{article.readingTime} min read</UnderlineLabel>
          </div>
        </div>
      </div>
    </PressRowLink>
  )
}

export function ArticlesHeading({ label }: { label: string }) {
  return (
    <div
      id="articles"
      className="flex h-12 items-start px-3 text-brand-dark-green md:h-[88px] md:pt-10"
    >
      <h2 className="font-sans text-[36px] leading-none tracking-[-0.02em]">
        {label}
      </h2>
    </div>
  )
}

export function GallerySection({ articles }: { articles: PressArticleRow[] }) {
  return (
    <section className="h-[319px] overflow-x-auto overflow-y-hidden bg-accent-tan md:h-auto md:overflow-visible md:px-3 md:py-10">
      <div className="flex w-max gap-3 py-10 pl-3 pr-3 md:grid md:w-auto md:grid-cols-4 md:p-0">
        {articles.map((article) => (
          <ExternalLink
            key={article.title}
            href={article.href}
            className="group flex w-[339px] shrink-0 cursor-pointer flex-col gap-1.5 text-brand-dark-green md:w-auto"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-brand-dark-green/10">
              <Image
                src={article.galleryImage}
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
          </ExternalLink>
        ))}
      </div>
    </section>
  )
}

export function FeaturedArticle({
  article,
  readArticleLabel,
}: {
  article: PressArticleRow
  readArticleLabel: string
}) {
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
              label={`${readArticleLabel}: ${article.title}`}
              tone="light"
              className="md:text-brand-dark-green md:decoration-brand-dark-green/50"
            >
              {readArticleLabel}
            </TextLink>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 h-[994px] overflow-hidden md:relative md:inset-auto md:h-[994px] md:w-[714px] md:shrink-0">
        <Image
          src={article.featuredImage}
          alt=""
          width={1242}
          height={994}
          className="absolute left-[-303px] top-0 h-[1040px] w-[1300px] max-w-none object-cover md:left-[-104px] md:h-full md:w-[1242px]"
        />
      </div>
    </section>
  )
}

export function ArticlesCta({ href, label }: { href: string; label: string }) {
  return <SectionCta href={href} label={label} />
}

export function BroadcastSection({
  href,
  latestEpisodeTitle,
  copy,
}: {
  href: string
  latestEpisodeTitle: string
  copy: Pick<
    PressCopy,
    | 'broadcastHeading'
    | 'broadcastDescription'
    | 'media'
    | 'latestEpisode'
    | 'broadcastCta'
  >
}) {
  return (
    <section
      id="broadcast"
      className="bg-accent-tan pt-[100px] text-brand-dark-green"
    >
      <div className="px-3 pb-3">
        <Link
          href={href}
          className="group relative block h-[560px] cursor-pointer overflow-hidden rounded-xl bg-brand-dark-green text-brand-off-white md:h-[406px]"
        >
          <div className="absolute inset-0 blur-[30px] md:inset-auto md:left-[-39px] md:top-1/2 md:h-[1897px] md:w-[1518px] md:-translate-y-1/2">
            <Image
              src={BROADCAST_BACKGROUND_IMAGE}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/40" />

          <div className="absolute left-3 top-3 flex h-[calc(100%-24px)] w-[calc(100%-24px)] flex-col justify-between md:h-[380px] md:w-[453px]">
            <div className="flex items-center gap-[102px]">
              <LogosMark size={6} className="shrink-0 text-brand-off-white" />
              <p className="font-mono text-[10px] font-medium uppercase leading-[1.3] text-brand-off-white">
                {copy.media}
              </p>
            </div>

            <div className="mb-[226px] flex w-full flex-col gap-3 md:mb-0">
              <h2 className="w-[185px] font-sans text-[24px] leading-[1.1] tracking-[-0.01em] text-brand-off-white">
                {copy.broadcastHeading}
              </h2>
              <p className="font-mono text-[10px] leading-[1.3] text-brand-off-white md:w-full">
                {copy.broadcastDescription}
              </p>
            </div>

            <div className="flex h-[30px] min-w-0 items-center gap-2.5">
              <PlayIcon inverted />
              <p className="shrink-0 whitespace-nowrap font-sans text-[14px] font-medium leading-[1.2] text-brand-off-white">
                {copy.latestEpisode}
              </p>
              <p className="min-w-0 truncate whitespace-nowrap font-display text-[14px] leading-[1.2] text-gray-03">
                {latestEpisodeTitle}
              </p>
            </div>
          </div>

          <div className="absolute left-3 right-3 top-[292px] h-[158px] overflow-hidden rounded-[72px] bg-accent-tan text-brand-dark-green transition-colors group-hover:bg-brand-yellow md:left-auto md:right-3 md:top-3 md:h-[382px] md:w-[702px] md:rounded-[100px]">
            <span className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 font-mono text-[10px] font-semibold uppercase leading-[1.35]">
              {copy.broadcastCta}
              <ArrowIcon />
            </span>
          </div>
        </Link>
      </div>
    </section>
  )
}
