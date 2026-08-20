import Image from 'next/image'

import { MediaSummary } from '../../../_components/media-summary'
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
    month: 'short',
    year: 'numeric',
  })
    .format(new Date(iso))
    .toUpperCase()
}

export function ArticleHero({ article, copy, canonicalUrl }: ArticleHeroProps) {
  const date = formatDate(article.publishedAt)

  return (
    <header className="mb-6 flex flex-col text-brand-dark-green">
      <div className="mb-3 flex flex-wrap items-center gap-2 font-sans text-[12px] leading-4">
        <span>{copy.minRead.toUpperCase()}</span>
        <span
          aria-hidden="true"
          className="size-[3px] rounded-full bg-current"
        />
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
          <p className="mt-4 max-w-full whitespace-pre-wrap font-sans text-[18px] leading-6 tracking-normal md:text-[16px]">
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
              className="flex h-6 items-center border border-brand-dark-green px-[7px] py-[3px] font-sans text-[12px] leading-4 text-brand-dark-green capitalize"
            >
              {tag.name.replace(/_/g, ' ')}
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
        <figure className="my-10 w-full max-md:my-6">
          <div className="relative aspect-[1200/630] w-full overflow-hidden bg-brand-dark-green/10">
            <Image
              src={article.coverImage.url}
              alt={article.coverImage.alt}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 767px) calc(100vw - 32px), 700px"
            />
          </div>
          <figcaption className="min-h-2 pt-2 font-sans text-[12px] leading-4">
            {article.coverImage.caption ?? ''}
          </figcaption>
        </figure>
      ) : null}

      <MediaSummary html={article.summaryHtml} text={article.summary} />
    </header>
  )
}
