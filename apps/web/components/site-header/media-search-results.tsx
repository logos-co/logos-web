import Image from 'next/image'
import { useTranslations } from 'next-intl'

import type { BlogSearchPost } from '@/lib/blog-search-api'
import { Link } from '@/i18n/navigation'

interface MediaSearchResultsProps {
  posts: readonly BlogSearchPost[]
  locale: string
  onResultClick: () => void
}

const formatDate = (value: string | null, locale: string) =>
  value
    ? new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(value))
    : ''

export function MediaSearchResults({
  posts,
  locale,
  onResultClick,
}: MediaSearchResultsProps) {
  const t = useTranslations('mediaSearch')

  return (
    <div className="border-t border-brand-dark-green">
      {posts.map((post) => (
        <Link
          key={`${post.type}-${post.slug}`}
          href={post.href}
          onClick={onResultClick}
          className="group grid cursor-pointer gap-4 border-b border-brand-dark-green py-5 transition-colors hover:bg-brand-dark-green hover:text-brand-off-white md:grid-cols-12 md:px-3"
        >
          <div className="flex items-start justify-between gap-4 md:col-span-2">
            <span className="font-mono text-[10px] leading-[1.3] font-medium uppercase">
              {post.type === 'article' ? t('article') : t('podcast')}
            </span>
            <span className="font-mono text-[10px] leading-[1.3] uppercase md:hidden">
              {formatDate(post.publishedAt, locale)}
            </span>
          </div>

          <div className="flex min-w-0 flex-col gap-2 md:col-span-7">
            <h2 className="font-display text-[24px] leading-[1.02] tracking-[-0.025em] md:text-[30px]">
              {post.title}
            </h2>
            {post.description ? (
              <p className="max-w-[620px] font-sans text-[14px] leading-[1.45]">
                {post.description}
              </p>
            ) : null}
            <span className="hidden font-mono text-[10px] leading-[1.3] uppercase md:block">
              {formatDate(post.publishedAt, locale)}
            </span>
          </div>

          {post.image ? (
            <div className="relative hidden aspect-[16/9] overflow-hidden md:col-span-3 md:block">
              <Image
                src={post.image.url}
                alt={post.image.alt}
                fill
                sizes="220px"
                className="object-cover grayscale transition-all group-hover:grayscale-0"
              />
            </div>
          ) : null}
        </Link>
      ))}
    </div>
  )
}
