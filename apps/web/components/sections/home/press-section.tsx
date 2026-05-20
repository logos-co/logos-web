import Image from 'next/image'

import type { RelatedArticlesSection } from '@repo/content/schemas'

import { Reveal, RevealItem } from '@/components/motion/reveal'
import { Button, ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'
import type { PressArticleRow } from '@/lib/press-engine'

interface PressCardProps {
  title: string
  imageSrc: string
  imageAlt: string
  date: string
  author: string
  readingTime: number
  href: string
  external: boolean
}

function PressCard({
  title,
  imageSrc,
  imageAlt,
  date,
  author,
  readingTime,
  href,
  external,
}: PressCardProps) {
  // External press articles open in a new tab; internal links use the
  // i18n-aware Link to keep route prefixes stable.
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex w-[339px] shrink-0 cursor-pointer flex-col gap-1.5 md:w-auto"
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
      className="group flex w-[339px] shrink-0 cursor-pointer flex-col gap-1.5 md:w-auto"
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
          className="h-full w-full object-cover transition-[filter,transform] duration-300 ease-out group-hover:scale-[1.02] group-hover:blur-[12px] group-focus-visible:scale-[1.02] group-focus-visible:blur-[12px]"
        />
        <div className="absolute inset-0 bg-brand-dark-green/0 transition-colors duration-300 ease-out group-hover:bg-brand-dark-green/18 group-focus-visible:bg-brand-dark-green/18" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
          <p className="text-eyebrow border-b border-brand-off-white pb-1 text-brand-off-white">
            {readingTime} min read
          </p>
        </div>
      </div>
      <div className="flex w-[339px] items-baseline gap-10">
        <p className="text-body-sans min-h-[51px] w-[169.5px] shrink-0 font-normal break-words text-brand-dark-green">
          {title}
        </p>
        <div className="shrink-0">
          <p className="text-eyebrow text-brand-dark-green">{date}</p>
          {author ? (
            <p className="text-eyebrow text-brand-dark-green">{author}</p>
          ) : null}
        </div>
      </div>
    </>
  )
}

type Props = {
  data: RelatedArticlesSection
  articles: PressArticleRow[]
}

export default function PressSection({ data, articles }: Props) {
  const cards = articles.map((article) => ({
    title: article.title,
    imageSrc: article.image,
    imageAlt: article.title,
    date: article.galleryDate,
    author: article.author,
    readingTime: article.readingTime,
    href: article.href,
    external: article.href.startsWith('https://'),
  }))

  return (
    <section id="press" className="h-[880px] bg-brand-off-white py-3">
      <div className="mx-auto max-w-354 px-3 md:px-0">
        <div className="relative h-[856px] overflow-hidden rounded-xl bg-accent-tan">
          {data.label ? (
            <p className="text-mono-s absolute top-6 left-3 w-56.5 text-brand-dark-green">
              {data.label}
            </p>
          ) : null}
          {data.eyebrow ? (
            <p className="text-mono-s absolute top-6 left-[714px] hidden w-56.5 text-brand-dark-green md:block">
              {data.eyebrow}
            </p>
          ) : null}
          {data.cta ? (
            <div className="absolute top-[22px] left-[191px] md:left-[1190px]">
              <Button
                href={data.cta.href}
                variant="link"
                icon={<ButtonArrowIcon />}
                className="cursor-pointer transition-opacity hover:opacity-70"
              >
                {data.cta.label}
              </Button>
            </div>
          ) : null}

          <Reveal
            amount={0.2}
            className="absolute top-[102px] left-1/2 w-[464px] -translate-x-1/2"
          >
            <h2 className="text-h2 text-center text-brand-dark-green">
              {data.title}
            </h2>
          </Reveal>

          <Reveal
            stagger
            amount={0.18}
            className="absolute top-[229px] right-0 left-3 flex gap-3 overflow-x-auto pr-3 md:right-3 md:grid md:grid-cols-4 md:overflow-visible md:pr-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {cards.map((card) => (
              <RevealItem key={card.href}>
                <PressCard {...card} />
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
