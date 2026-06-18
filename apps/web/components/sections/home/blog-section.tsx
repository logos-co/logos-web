import Image from 'next/image'

import type { RelatedArticlesSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Button, ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'
import type { BlogArticleRow } from '@/lib/blog-engine'

interface BlogCardProps {
  title: string
  imageSrc: string
  imageAlt: string
  date: string
  author: string
  readingTime: number
  href: string
  external: boolean
}

function BlogCard({
  title,
  imageSrc,
  imageAlt,
  date,
  author,
  readingTime,
  href,
  external,
}: BlogCardProps) {
  // External blog articles open in a new tab; internal links use the
  // i18n-aware Link to keep route prefixes stable.
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex w-[calc(100vw-24px)] max-w-[339px] shrink-0 cursor-pointer flex-col gap-1.5 desktop:w-auto desktop:max-w-none"
      >
        <CardBody
          title={title}
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          date={date}
          author={author}
          readingTime={readingTime}
        />
      </a>
    )
  }
  return (
    <Link
      href={href}
      className="group flex w-[calc(100vw-24px)] max-w-[339px] shrink-0 cursor-pointer flex-col gap-1.5 desktop:w-auto desktop:max-w-none"
    >
      <CardBody
        title={title}
        imageSrc={imageSrc}
        imageAlt={imageAlt}
        date={date}
        author={author}
        readingTime={readingTime}
      />
    </Link>
  )
}

function CardBody({
  title,
  imageSrc,
  imageAlt,
  date,
  author,
  readingTime,
}: {
  title: string
  imageSrc: string
  imageAlt: string
  date: string
  author: string
  readingTime: number
}) {
  return (
    <>
      <div className="relative aspect-339/431 w-full overflow-hidden bg-brand-dark-green/10">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={339}
          height={431}
          className="h-full w-full object-cover transition-[filter,transform] duration-700 ease-out group-hover:scale-[1.01] group-hover:blur-[4px] group-focus-visible:scale-[1.01] group-focus-visible:blur-[4px]"
        />
        <div className="absolute inset-0 bg-brand-dark-green/0 transition-colors duration-300 ease-out group-hover:bg-brand-dark-green/18 group-focus-visible:bg-brand-dark-green/18" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
          <p className="text-eyebrow border-b border-brand-off-white pb-1 text-brand-off-white">
            {readingTime} min read
          </p>
        </div>
      </div>
      <div className="flex w-full max-w-[339px] items-baseline gap-10">
        <p className="min-h-[51px] w-[169.5px] shrink-0 break-words font-sans text-[12px] leading-[1.2] font-medium text-brand-dark-green desktop:text-body-sans desktop:font-normal">
          {title}
        </p>
        <div className="shrink-0">
          <p className="font-mono-body text-[10px] leading-[1.3] font-normal text-brand-dark-green desktop:text-eyebrow">
            {date}
          </p>
          {author ? (
            <p className="font-mono-body text-[10px] leading-[1.3] font-normal text-brand-dark-green desktop:text-eyebrow">
              {author}
            </p>
          ) : null}
        </div>
      </div>
    </>
  )
}

type Props = {
  data: RelatedArticlesSection
  articles: BlogArticleRow[]
}

export default function BlogSection({ data, articles }: Props) {
  const cards = articles.map((article) => ({
    title: article.title,
    imageSrc: article.cardImage,
    imageAlt: article.title,
    date: article.galleryDate,
    author: article.author,
    readingTime: article.readingTime,
    href: article.href,
    external: article.href.startsWith('https://'),
  }))

  return (
    <section
      id="blog"
      className="bg-brand-off-white px-3 pt-[140px] pb-3 lg:mt-[112px] lg:px-0 lg:py-3"
    >
      <ContentWidth className="relative h-[856px] overflow-hidden rounded-xl bg-accent-tan px-3 pt-6 pb-3 lg:h-auto lg:overflow-visible lg:pt-6 lg:pb-[141px]">
        <div className="flex flex-col lg:gap-0">
          {(data.label || data.eyebrow || data.cta) && (
            <div className="contents lg:flex lg:items-center lg:justify-between">
              {data.label ? (
                <p className="font-mono-body absolute top-6 right-[169px] left-3 text-[10px] leading-[1.3] font-normal text-brand-dark-green lg:static lg:right-auto lg:w-auto lg:text-mono-s">
                  {data.label}
                </p>
              ) : null}
              {data.eyebrow ? (
                <p className="text-mono-s hidden text-brand-dark-green lg:block">
                  {data.eyebrow}
                </p>
              ) : null}
              {data.cta ? (
                <Button
                  href={data.cta.href}
                  variant="link"
                  icon={<ButtonArrowIcon />}
                  className="absolute top-[23px] right-[41px] cursor-pointer transition-opacity hover:opacity-70 lg:static [&>span]:gap-1 lg:[&>span]:gap-1.5"
                >
                  {data.cta.label}
                </Button>
              ) : null}
            </div>
          )}

          <h2 className="absolute top-[102px] left-1/2 w-[464px] max-w-none -translate-x-1/2 text-center font-display text-[56px] leading-none tracking-[-1.68px] text-brand-dark-green lg:static lg:mx-auto lg:mt-[47px] lg:w-[464px] lg:translate-x-0 lg:text-h2">
            {data.title}
          </h2>

          <div
            className="absolute top-[229px] left-0 flex w-full gap-3 overflow-x-auto pr-3 pl-3 lg:static lg:mt-[83px] lg:w-auto lg:max-desktop:-mx-3 desktop:grid desktop:grid-cols-4 desktop:overflow-visible desktop:pr-0 desktop:pl-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {cards.map((card) => (
              <BlogCard key={card.href} {...card} />
            ))}
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}
