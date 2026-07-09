import Image from 'next/image'

import { ShareButton } from '../../../_components/share-button'
import type { ArticleDetailSectionProps } from './types'

interface ArticleHeroProps extends ArticleDetailSectionProps {
  canonicalUrl: string
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function ArticleHero({ article, copy, canonicalUrl }: ArticleHeroProps) {
  const date = formatDate(article.publishedAt)

  return (
    <header className="mb-6 flex flex-col text-brand-dark-green">
      <div className="mb-3 flex flex-wrap items-center gap-2 font-sans text-[12px] leading-4">
        <span className="uppercase">{copy.minRead}</span>
        <span aria-hidden="true">•</span>
        {date ? <span>{date}</span> : null}
      </div>

      <div>
        <h1
          id="title-anchor"
          className="scroll-mt-[95px] font-display text-[44px] leading-[54px] tracking-normal"
        >
          {article.title}
        </h1>
        {article.subtitle ? (
          <p className="mt-4 max-w-full whitespace-pre-wrap font-sans text-[18px] leading-6 tracking-normal">
            {article.subtitle}
          </p>
        ) : null}
      </div>

      {article.authors.length > 0 ? (
        <div className="mb-8 mt-4 flex flex-wrap items-center gap-3">
          {article.authors.map((author, index) => (
            <div
              key={author.id || author.name}
              className="flex items-center gap-3"
            >
              <span className="flex items-center gap-2">
                <span className="flex size-4 items-center justify-center rounded-full border border-brand-dark-green font-sans text-[11px] leading-4">
                  {author.name.slice(0, 1)}
                </span>
                <span className="font-sans text-[12px] leading-4">
                  {author.name}
                </span>
              </span>
              {index < article.authors.length - 1 ? (
                <span aria-hidden="true">•</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex w-fit max-w-full items-start gap-4">
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag.id || tag.name}
              className="border border-brand-dark-green px-2 py-1 font-sans text-[12px] leading-4 text-brand-dark-green"
            >
              {tag.name}
            </span>
          ))}
        </div>
        <span
          aria-hidden="true"
          className="mt-1.5 h-3 border-l border-brand-dark-green"
        />
        <ShareButton
          label={copy.share}
          copiedLabel={copy.copied}
          title={article.title}
          url={canonicalUrl}
        />
      </div>

      {article.coverImage ? (
        <figure className="relative my-10 aspect-[1200/630] w-full overflow-hidden bg-brand-dark-green/10 max-md:my-6">
          <Image
            src={article.coverImage.url}
            alt={article.coverImage.alt}
            width={article.coverImage.width || 1200}
            height={article.coverImage.height || 630}
            priority
            className="h-full w-full object-cover"
            sizes="(max-width: 767px) calc(100vw - 32px), 700px"
          />
        </figure>
      ) : null}

      {article.summary ? (
        <div className="border-y border-brand-dark-green py-6 max-sm:py-4">
          <p className="whitespace-pre-wrap font-display text-[20px] leading-[30px] tracking-normal text-brand-dark-green max-sm:font-sans max-sm:text-[18px] max-sm:leading-6">
            {article.summary}
          </p>
        </div>
      ) : null}
    </header>
  )
}
