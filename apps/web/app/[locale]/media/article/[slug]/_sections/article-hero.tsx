import Image from 'next/image'

import { ShareButton } from './share-button'
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
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-12 font-mono text-[10px] font-semibold uppercase leading-[1.35] text-brand-dark-green">
        <span>{copy.minRead}</span>
        {date ? <span>{date}</span> : null}
      </div>

      <div className="flex flex-col gap-4 text-brand-dark-green">
        <h1 className="font-display text-[40px] leading-none tracking-normal md:text-[56px]">
          {article.title}
        </h1>
        {article.subtitle ? (
          <p className="max-w-full font-sans text-[12px] font-medium leading-[1.2] tracking-normal">
            {article.subtitle}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-stretch gap-3">
        {article.tags.map((tag) => (
          <span
            key={tag.id || tag.name}
            className="border border-brand-dark-green px-[10px] py-[6px] font-mono text-[10px] font-semibold leading-[1.35] text-brand-dark-green"
          >
            {tag.name}
          </span>
        ))}
        <ShareButton
          label={copy.share}
          copiedLabel={copy.copied}
          title={article.title}
          url={canonicalUrl}
        />
      </div>

      {article.coverImage ? (
        <div className="relative aspect-[1200/630] w-full overflow-hidden bg-brand-dark-green/10">
          <Image
            src={article.coverImage.url}
            alt={article.coverImage.alt}
            width={article.coverImage.width || 1200}
            height={article.coverImage.height || 630}
            priority
            className="h-full w-full object-cover"
            sizes="(max-width: 1024px) calc(100vw - 24px), 940px"
          />
        </div>
      ) : null}

      {article.summary ? (
        <div className="border-y border-brand-dark-green/50 py-6 md:py-12">
          <p className="font-sans text-[24px] leading-none tracking-normal text-brand-dark-green md:text-[36px]">
            {article.summary}
          </p>
        </div>
      ) : null}
    </section>
  )
}
