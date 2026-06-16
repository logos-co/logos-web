import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'
import { Button } from '@/components/ui'

import type { LambdaPrizePageCopy, PrizeCopy } from './types'

const prizeImages = [
  '/images/lambda-prize/prize-1.webp',
  '/images/lambda-prize/prize-2.webp',
  '/images/lambda-prize/prize-3.webp',
]

function PrizeCard({ prize, image }: { prize: PrizeCopy; image: string }) {
  return (
    <article className="relative h-[551px] overflow-hidden rounded-xl text-brand-off-white">
      <Image
        src={image}
        alt=""
        fill
        sizes="33vw"
        className="scale-105 object-cover blur-[6px]"
      />
      <div className="absolute inset-0 bg-brand-dark-green/35" />
      <div className="relative z-10 flex h-full flex-col justify-between p-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="text-mono-s flex flex-col">
            {prize.meta.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          <span className="text-mono-s shrink-0 rounded-[4px] bg-[#c8f1ff] px-6 py-2 text-brand-dark-green">
            {prize.status}
          </span>
        </div>
        <div className="mx-auto flex w-[220px] flex-col items-center gap-6 text-center">
          <h3 className="text-h4-serif">{prize.title}</h3>
          <Button
            href={prize.href}
            className="cursor-pointer bg-brand-off-white text-brand-dark-green"
          >
            Learn More
          </Button>
        </div>
        <p className="text-mono-s w-[276px] max-w-full">{prize.body}</p>
      </div>
    </article>
  )
}

export function FeaturedPrizes({
  copy,
}: {
  copy: LambdaPrizePageCopy['featured']
}) {
  return (
    <section className="mt-25 bg-brand-off-white px-0 text-brand-dark-green lg:mt-50 lg:px-3">
      <ContentWidth>
        <h2 className="text-h3-serif">{copy.heading}</h2>
        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:mt-12">
          {copy.prizes.map((prize, index) => (
            <PrizeCard
              key={`${prize.title}-${index}`}
              prize={prize}
              image={prizeImages[index % prizeImages.length]}
            />
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
