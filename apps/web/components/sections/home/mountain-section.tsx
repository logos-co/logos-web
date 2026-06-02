import Image from 'next/image'

import type { FeaturedTextSection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

const MOUNTAIN_ASPECT_RATIO = '1416 / 2283'
const MOUNTAIN_IMAGE_WIDTH_RATIO = '130.65%'
const MOUNTAIN_CLIP_PATH = 'inset(0 round 900px)'

type Props = {
  data: FeaturedTextSection
}

export default function MountainSection({ data }: Props) {
  return (
    <section className="bg-brand-off-white px-3">
      <div>
        <div className="relative">
          <div
            className="relative z-10 overflow-hidden rounded-[900px] bg-brand-off-white"
            style={{ aspectRatio: MOUNTAIN_ASPECT_RATIO }}
          >
            <div className="absolute inset-x-0 top-px bottom-0 overflow-hidden rounded-[900px]">
              <Image
                src="/images/home/mountain-landscape.jpg"
                alt=""
                width={1850}
                height={2313}
                sizes="(min-width: 1440px) 1850px, 131vw"
                className="absolute top-0 left-1/2 h-auto max-w-none -translate-x-1/2"
                style={{ width: MOUNTAIN_IMAGE_WIDTH_RATIO }}
              />
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{ clipPath: MOUNTAIN_CLIP_PATH }}
          >
            <div className="absolute inset-x-0 bottom-[-100svh] top-[-100svh]">
              <div className="sticky top-0 h-svh">
                <div className="flex h-full flex-col items-center justify-center gap-10 px-4 text-center min-[1025px]:gap-[60px] min-[1025px]:px-0">
                  <h2 className="text-h1 w-full max-w-88 text-brand-off-white min-[1025px]:max-w-full">
                    <span className="text-accent-light-blue">
                      {data.title.highlight}
                    </span>
                    <span>{` ${data.title.rest}`}</span>
                  </h2>

                  {data.cta ? (
                    <div className="pointer-events-auto">
                      <Button
                        href={data.cta.href}
                        className="bg-brand-off-white text-brand-dark-green backdrop-blur-none transition-opacity hover:opacity-80"
                      >
                        {data.cta.label}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
