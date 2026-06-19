/**
 * Shared building blocks for related-articles sections on technology-stack
 * pages.
 */
import Image from 'next/image'

import { ExternalLink } from '@/components/ui'
import type { BlogArticleRow } from '@/lib/blog-engine'
import { blogArticlesToTechStackRelatedCards } from '@/lib/tech-stack-related-articles'

export type ArticleCardProps = {
  title: string
  mobileTitle?: string
  imageSrc: string
  imageAlt: string
  imagePosition?: string
  date: string
  author: string
  readingTime?: number
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

/** Reshape blog article rows into props for `<ArticleCard />`. */
export function articlesToCards(
  articles: ReadonlyArray<BlogArticleRow>
): Omit<ArticleCardProps, 'titleClassName'>[] {
  return blogArticlesToTechStackRelatedCards(articles)
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
  readingTime,
  href,
  titleClassName = DEFAULT_TITLE_CLASSNAME,
}: ArticleCardProps) {
  return (
    <ExternalLink
      href={href}
      className="group flex w-[calc(100vw-24px)] max-w-84.75 shrink-0 cursor-pointer flex-col gap-1.5 desktop:w-auto desktop:max-w-none"
    >
      <div className="relative aspect-339/431 w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={339}
          height={431}
          draggable={false}
          className="h-full w-full object-cover transition-[filter,transform] duration-700 ease-out group-hover:scale-[1.01] group-hover:blur-[4px] group-focus-visible:scale-[1.01] group-focus-visible:blur-[4px]"
          style={imagePosition ? { objectPosition: imagePosition } : undefined}
        />
        <div className="absolute inset-0 bg-brand-dark-green/0 transition-colors duration-300 ease-out group-hover:bg-brand-dark-green/18 group-focus-visible:bg-brand-dark-green/18" />
        {readingTime ? (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
            <p className="text-eyebrow border-b border-brand-off-white pb-1 text-brand-off-white">
              {readingTime} min read
            </p>
          </div>
        ) : null}
      </div>
      <div className="flex items-baseline gap-10">
        <p className={titleClassName}>
          {mobileTitle ? (
            <>
              <span className="lg:hidden">{mobileTitle}</span>
              <span className="hidden lg:inline">{title}</span>
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
