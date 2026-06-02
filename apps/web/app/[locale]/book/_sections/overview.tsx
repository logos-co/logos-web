import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'

export function Overview() {
  return (
    <section className="border-t border-brand-dark-green/10 px-3 py-16 md:py-24">
      <ContentWidth className="grid gap-3 md:grid-cols-12">
        <div className="md:col-span-7">
          <div className="relative aspect-[1588/1436] overflow-hidden rounded">
            <Image
              src="/book/farewell-overview.webp"
              alt="Farewell to Westphalia overview"
              fill
              sizes="(min-width: 768px) 58vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="flex flex-col justify-center gap-6 md:col-span-4 md:col-start-9">
          <p className="font-display text-[32px] leading-[1.05] tracking-[-0.03em] md:text-[48px]">
            What comes after the 400-year-old nation-state system?
          </p>
          <div className="space-y-5 font-sans text-[16px] leading-[1.25]">
            <p>
              Has this revolution already started from the depths of the
              internet? Farewell to Westphalia explores what is likely to
              succeed nation states, from cyberstates to internet movements,
              backed by the authors' decades of experience.
            </p>
            <p>
              We believe - and Farewell to Westphalia argues - that
              decentralised communities and blockchain governance, at every
              level, are not only feasible but are on the immediate horizon.
              Furthermore, the seeds have already been planted. Logos' aim is to
              nurture those embryonic forms of blockchain governance and make
              their future adoption as frictionless as possible.
            </p>
          </div>
        </div>
      </ContentWidth>
    </section>
  )
}
