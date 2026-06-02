import Image from 'next/image'

import { type Circle } from '@repo/content/loaders'
import type { CirclesSettings } from '@repo/content/schemas'
import { LogosMark } from '@acid-info/logos-ui'

import { Button } from '@/components/ui'

import { ArrowIcon } from '../_helpers'

export function CirclesHero({
  settings,
  circles,
}: {
  settings: CirclesSettings
  circles: Circle[]
}) {
  const { hero } = settings
  const mobileHeroImage = circles[0]?.image

  return (
    <section className="relative h-[494px] bg-brand-off-white px-3 md:h-auto md:min-h-[579px] md:pt-10">
      {mobileHeroImage ? (
        <div className="absolute left-3 top-6 h-[75px] w-[107px] overflow-hidden md:hidden">
          <Image
            src={mobileHeroImage.src}
            alt={mobileHeroImage.alt}
            fill
            sizes="107px"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      {hero.topRightCta ? (
        <Button
          href={hero.topRightCta.href}
          variant="tertiary"
          className="absolute right-3 top-6 hidden md:inline-flex"
          {...(hero.topRightCta.external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {hero.topRightCta.label}
        </Button>
      ) : (
        <p className="text-mono-s absolute right-3 top-6 hidden w-[226px] text-brand-dark-green md:block">
          {hero.eyebrow ?? 'Local chapters'}
        </p>
      )}

      <Button
        href={hero.joinCta.href}
        variant="tertiary"
        className="absolute left-[calc(50%+6px)] top-6 translate-x-0 px-0 md:left-1/2 md:-translate-x-1/2"
        icon={<ArrowIcon />}
        {...(hero.joinCta.external
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {hero.joinCta.label}
      </Button>

      <div className="mx-auto flex max-w-360 flex-col">
        <div className="absolute inset-x-0 top-[130px] flex justify-center md:relative md:top-auto md:mt-[119px]">
          <h1 className="flex items-center gap-2 font-display text-[40px] leading-none text-brand-dark-green md:text-[48px]">
            <span className="flex size-[41px] items-center justify-center rounded-full border border-brand-dark-green/50 md:size-[41px]">
              <LogosMark
                size={16}
                className="hidden text-brand-dark-green md:inline-block"
              />
            </span>
            {hero.title}
          </h1>
        </div>

        <div className="absolute left-3 top-[274px] grid w-[calc(100%-24px)] gap-6 md:static md:mt-39 md:w-auto md:grid-cols-12 md:gap-3">
          <p className="text-mono-s hidden text-brand-dark-green md:col-span-2 md:block">
            {hero.eyebrow ?? 'Local chapters at the heart of Logos.'}
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 md:col-span-4 md:col-start-7 md:flex md:flex-col md:items-start">
            <p className="text-mono-s col-span-2 max-w-[422px] text-brand-dark-green">
              {hero.description}
            </p>
            <Button
              href={hero.joinCta.href}
              variant="tertiary"
              className="col-start-2 w-fit px-0 md:hidden"
              icon={<ArrowIcon />}
              {...(hero.joinCta.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {hero.joinCta.label}
            </Button>
            <Button
              href={hero.findCta.href}
              variant="tertiary"
              className="hidden px-0 md:inline-flex"
              icon={<ArrowIcon />}
            >
              {hero.findCta.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
