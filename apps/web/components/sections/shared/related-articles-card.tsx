/**
 * Shared building blocks for the per-domain `*-related-articles.tsx` sections
 * on the technology-stack pages (blockchain / storage / networking /
 * messaging).
 *
 * The four pages keep their own outer layout to preserve Figma pixel fidelity
 * (each frame has different absolute/flow positioning, heights, and Button
 * variants), but the article-card markup and Press Engine row → card-prop
 * reshape are byte-identical and live here.
 */
import Image from 'next/image'

import { ExternalLink } from '@/components/ui'
import type { PressArticleRow } from '@/lib/press-engine'

export type ArticleCardProps = {
  title: string
  mobileTitle?: string
  imageSrc: string
  imageAlt: string
  imagePosition?: string
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

/** Reshape Press Engine article rows into props for `<ArticleCard />`. */
export function articlesToCards(
  articles: ReadonlyArray<PressArticleRow>
): Omit<ArticleCardProps, 'titleClassName'>[] {
  return articles.map((article) => ({
    title: article.title,
    imageSrc: article.image,
    imageAlt: article.title,
    date: article.galleryDate,
    author: article.author,
    href: article.href,
  }))
}

/** Article card used inside related-articles section frames on tech pages. */
export function ArticleCard({
  title,
  mobileTitle,
  imageSrc,
  imageAlt,
  imagePosition,
  date,
  author,
  href,
  titleClassName = DEFAULT_TITLE_CLASSNAME,
}: ArticleCardProps) {
  return (
    <ExternalLink
      href={href}
      className="group flex w-84.75 shrink-0 cursor-pointer flex-col gap-1.5 md:w-auto"
    >
      <div className="aspect-339/431 w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={339}
          height={431}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={imagePosition ? { objectPosition: imagePosition } : undefined}
        />
      </div>
      <div className="flex items-baseline gap-10">
        <p className={titleClassName}>
          {mobileTitle ? (
            <>
              <span className="md:hidden">{mobileTitle}</span>
              <span className="hidden md:inline">{title}</span>
            </>
          ) : (
            title
          )}
        </p>
        <div className="shrink-0">
          <p className="text-mono-s text-brand-dark-green">{date}</p>
          {author ? (
            <p className="text-mono-s text-brand-dark-green">{author}</p>
          ) : null}
        </div>
      </div>
    </ExternalLink>
  )
}
