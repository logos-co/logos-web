import Image from 'next/image'

import type { RoadmapCopySection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { Link } from '@/i18n/navigation'

import { ActionPill } from './atoms'
import type { OverviewCard } from './types'

interface RoadmapOverviewProps {
  data: RoadmapCopySection['overview']
}

export function RoadmapOverview({ data }: RoadmapOverviewProps) {
  return (
    <section
      id="roadmap-overview"
      className="mt-20 bg-brand-off-white pt-20 pb-20 md:max-desktop:pt-0 md:max-desktop:pb-0 desktop:mt-10 desktop:pt-0 desktop:pb-28"
    >
      <ContentWidth>
        <h2 className="text-h3-sans md:max-desktop:text-h3-serif text-brand-dark-green md:max-desktop:[text-box-edge:cap_alphabetic] md:max-desktop:[text-box-trim:trim-both]">
          {data.heading}
        </h2>

        <div className="mt-6 grid gap-3 md:max-desktop:grid-cols-2 desktop:grid-cols-[460px_460px_460px]">
          {data.cards.map((card) => (
            <RoadmapOverviewCard key={card.id} card={card} />
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}

function RoadmapOverviewCard({ card }: { card: OverviewCard }) {
  const cardClassName =
    'relative block h-[420px] w-full overflow-hidden rounded-xl bg-[#2f2f2f] text-brand-off-white [contain:paint] md:h-[480px] desktop:w-[460px]'
  const content = <RoadmapOverviewCardContent card={card} />

  if (!card.cta?.href) {
    return <article className={cardClassName}>{content}</article>
  }

  const linkClassName = `${cardClassName} group/roadmap-card cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-green`

  if (card.cta.href.startsWith('https://')) {
    return (
      <a
        href={card.cta.href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={card.cta.href} className={linkClassName}>
      {content}
    </Link>
  )
}

function RoadmapOverviewCardContent({ card }: { card: OverviewCard }) {
  const isAnnouncementCard = !card.title

  return (
    <>
      <RoadmapCardBackground card={card} />
      {card.cta?.href ? (
        <span className="pointer-events-none absolute inset-0 bg-white/0 transition-colors duration-300 ease-out group-hover/roadmap-card:bg-white/10 group-focus-visible/roadmap-card:bg-white/10" />
      ) : null}

      {isAnnouncementCard ? (
        <p className="absolute top-1/2 left-1/2 w-[min(336px,calc(100%-48px))] -translate-x-1/2 -translate-y-1/2 text-center font-sans text-[18px] leading-[1.15] text-brand-off-white">
          {card.body[0]}
        </p>
      ) : (
        <div className="absolute top-[60px] right-2.5 bottom-[60px] left-2.5 flex flex-col items-center justify-between">
          <h3 className="text-center font-sans text-[24px] leading-[1.1] text-brand-off-white">
            {card.title}
          </h3>
          <div className="flex w-[min(336px,calc(100%-24px))] flex-col gap-4 text-center font-sans text-[18px] leading-[1.15] text-brand-off-white">
            {card.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {card.cta ? (
            <ActionPill
              action={card.cta}
              asLink={false}
              className="transition-colors duration-300 ease-out group-hover/roadmap-card:bg-white group-focus-visible/roadmap-card:bg-white"
            />
          ) : (
            <span />
          )}
        </div>
      )}
    </>
  )
}

const interactiveBackgroundClassName =
  'transition-transform duration-700 ease-out group-hover/roadmap-card:scale-[1.04] group-focus-visible/roadmap-card:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none'

function RoadmapCardBackground({ card }: { card: OverviewCard }) {
  switch (card.id) {
    case 'logosCoreRuntime':
      return (
        <div className="absolute top-[-287px] left-[-130px] h-[709px] w-[720px] blur-[72px]">
          <Image
            src={card.image.src}
            alt={card.image.alt}
            fill
            sizes="720px"
            className={`object-cover ${interactiveBackgroundClassName}`}
          />
        </div>
      )
    case 'networking':
      return (
        <div className="absolute top-[-112px] left-[-440px] h-[704px] w-[1340px] blur-[72px]">
          <Image
            src={card.image.src}
            alt={card.image.alt}
            fill
            sizes="1340px"
            className={`object-cover ${interactiveBackgroundClassName}`}
          />
        </div>
      )
    case 'blockchain':
      return (
        <div className="absolute top-[-124px] left-[-120px] h-[875px] w-[700px] rotate-180 blur-[67px]">
          <Image
            src={card.image.src}
            alt={card.image.alt}
            fill
            sizes="700px"
            className={`object-cover ${interactiveBackgroundClassName}`}
          />
        </div>
      )
    case 'messaging':
      return (
        <div className="absolute top-[-143px] left-[-40px] h-[766px] w-[574px] blur-[102px] desktop:left-[-57px]">
          <Image
            src={card.image.src}
            alt={card.image.alt}
            fill
            sizes="574px"
            className={`object-cover ${interactiveBackgroundClassName}`}
          />
        </div>
      )
    case 'storage':
      return (
        <div className="absolute top-[-143px] left-[-40px] h-[766px] w-[574px] blur-[62px] desktop:left-[-57px]">
          <Image
            src={card.image.src}
            alt={card.image.alt}
            fill
            sizes="574px"
            className={`object-cover ${interactiveBackgroundClassName}`}
          />
        </div>
      )
    default:
      return (
        <div className="absolute top-[calc(50%+36px)] left-[-39px] h-[1867px] w-[1494px] -translate-y-1/2 blur-[20px]">
          <Image
            src={card.image.src}
            alt={card.image.alt}
            fill
            sizes="1494px"
            className={`object-cover ${interactiveBackgroundClassName}`}
          />
        </div>
      )
  }
}
