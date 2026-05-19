import Image from 'next/image'

import type { RelatedArticlesSection } from '@repo/content/schemas'

import { Button, ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'
import type { PressArticleRow } from '@/lib/press-engine'

interface PressCardProps {
  title: string
  imageSrc: string
  imageAlt: string
  date: string
  author: string
  href: string
  external: boolean
}

const FIGMA_PRESS_CARDS = [
  {
    title: 'State of the Logos Network: November 2025',
    imageSrc: '/images/home/figma-refresh/press-1.webp',
  },
  {
    title: 'Story of the Network: From CyberNetics to Blockchain Communities',
    imageSrc: '/images/home/figma-refresh/press-2.webp',
  },
  {
    title: 'State of the Logos Network: October 2025',
    imageSrc: '/images/home/figma-refresh/press-3.webp',
  },
  {
    title: 'Hacking for Real World Impact with Funding the Commons & Tor',
    imageSrc: '/images/home/figma-refresh/press-4.webp',
  },
] as const

function PressCard({
  title,
  imageSrc,
  imageAlt,
  date,
  author,
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
}: {
  title: string
  imageSrc: string
  imageAlt: string
  date: string
  author: string
}) {
  return (
    <>
      <div className="aspect-339/431 w-full overflow-hidden bg-brand-dark-green/10">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={339}
          height={431}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="flex gap-10 items-baseline">
        <p className="text-body-sans flex-1 font-medium text-brand-dark-green">
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
  const cards = articles.map((article, index) => ({
    title: FIGMA_PRESS_CARDS[index]?.title ?? article.title,
    imageSrc: FIGMA_PRESS_CARDS[index]?.imageSrc ?? article.image,
    imageAlt: FIGMA_PRESS_CARDS[index]?.title ?? article.title,
    date: '02.14.26',
    author: 'Sterlin Lujan',
    href: article.href,
    external: article.href.startsWith('https://'),
  }))

  return (
    <section id="press" className="h-[880px] bg-brand-off-white py-3">
      <div className="mx-auto max-w-354 px-3">
        <div className="relative h-[856px] overflow-hidden rounded-xl bg-accent-tan px-3">
          <div className="absolute top-6 right-3 left-3 flex items-start justify-between">
            {data.label ? (
              <p className="text-mono-s text-brand-dark-green w-56.5">
                {data.label}
              </p>
            ) : null}
            {data.eyebrow ? (
              <p className="text-mono-s hidden text-center text-brand-dark-green md:block">
                {data.eyebrow}
              </p>
            ) : null}
            {data.cta ? (
              <div className="w-56.5 flex justify-end">
                <Button
                  href={data.cta.href}
                  variant="link"
                  icon={<ButtonArrowIcon />}
                  className="transition-opacity hover:opacity-70"
                >
                  {data.cta.label}
                </Button>
              </div>
            ) : null}
          </div>

          <h2 className="text-h2 text-brand-dark-green absolute top-[102px] right-3 left-3 text-center">
            {data.title}
          </h2>

          <div
            className="absolute top-[241px] right-0 left-3 flex gap-3 overflow-x-auto pr-3 md:right-3 md:grid md:grid-cols-4 md:overflow-visible md:pr-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {cards.map((card) => (
              <PressCard key={card.href} {...card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
