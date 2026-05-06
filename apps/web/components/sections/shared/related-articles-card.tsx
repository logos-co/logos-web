/**
 * Shared building blocks for the per-domain `*-related-articles.tsx` sections
 * on the technology-stack pages (blockchain / storage / networking /
 * messaging).
 *
 * The four pages keep their own outer layout to preserve Figma pixel fidelity
 * (each frame has different absolute/flow positioning, heights, and Button
 * variants), but the article-card markup, the date formatter, and the
 * PressArticle → card-prop reshape are byte-identical and live here.
 */
import Image from 'next/image'

import type { PressArticle } from '@repo/content/loaders'

export type ArticleCardProps = {
  title: string
  imageSrc: string
  imageAlt: string
  date: string
  author: string
  href: string
  /**
   * Optional override for the card title's `<p>` className.
   * Defaults to the body-sans treatment used by blockchain/networking;
   * storage and messaging supply their own typography here.
   */
  titleClassName?: string
}

const DEFAULT_TITLE_CLASSNAME =
  'text-body-sans flex-1 font-medium text-brand-dark-green'

/** Format an ISO timestamp as `MM.DD.YY` in UTC (en-US 2-digit parts). */
export function formatPressDateUTC(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso))
  const month = parts.find((p) => p.type === 'month')?.value ?? ''
  const day = parts.find((p) => p.type === 'day')?.value ?? ''
  const year = parts.find((p) => p.type === 'year')?.value ?? ''
  return `${month}.${day}.${year}`
}

/** Reshape a `PressArticle[]` into props for `<ArticleCard />`. */
export function articlesToCards(
  articles: ReadonlyArray<PressArticle>,
): Omit<ArticleCardProps, 'titleClassName'>[] {
  return articles.map((article) => ({
    title: article.title,
    imageSrc: article.image.src,
    imageAlt: article.image.alt || article.title,
    date: article.displayDate ?? formatPressDateUTC(article.publishedAt),
    author: article.author?.name ?? '',
    href: article.externalUrl,
  }))
}

/** Article card used inside related-articles section frames on tech pages. */
export function ArticleCard({
  title,
  imageSrc,
  imageAlt,
  date,
  author,
  href,
  titleClassName = DEFAULT_TITLE_CLASSNAME,
}: ArticleCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex w-84.75 shrink-0 cursor-pointer flex-col gap-1.5 md:w-auto"
    >
      <div className="aspect-339/431 w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={339}
          height={431}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="flex items-baseline gap-10">
        <p className={titleClassName}>{title}</p>
        <div className="shrink-0">
          <p className="text-mono-s text-brand-dark-green">{date}</p>
          {author ? (
            <p className="text-mono-s text-brand-dark-green">{author}</p>
          ) : null}
        </div>
      </div>
    </a>
  )
}
