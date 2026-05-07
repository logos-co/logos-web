import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { IconMask } from '@/components/icons/icon-mask'
import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'

const actions = [
  {
    label: 'Amazon',
    subtext: 'Print/Kindle',
    href: 'https://www.amazon.com/Farewell-Westphalia-Sovereignty-Post-Nation-State-Governance/dp/B0FQLV79ZN/ref=tmm_pap_swatch_0',
    external: true,
  },
  {
    label: 'Open source',
    subtext: 'Free',
    href: '/book/farewell-to-westphalia-foss-edition.pdf',
    external: true,
  },
  {
    label: 'Non-Amazon',
    subtext: 'Ereader',
    href: 'https://books2read.com/u/3nzEAx',
    external: true,
  },
  {
    label: 'Translations',
    subtext: 'Free',
    href: '#translations',
    external: false,
  },
] as const

const authors = [
  {
    name: 'Jarrad Hope',
    image: '/book/jarrad-hope.webp',
    text: [
      'Jarrad came to Bitcoin in early 2011 through agorism, countereconomics, and crypto anarchy. Seeing that Bitcoin could operate a monetary policy in a hostile environment, he began to view public blockchains as a voluntary social order, one that did not depend on a monopoly of violence.',
      'From there, he participated in early attempts to generalise the Bitcoin script to advance institutional libertarianism, ultimately becoming an early contributor to Ethereum. While advancing privacy technologies through the development of the end-to-end encrypted and peer-to-peer private messaging client and super app Status, Jarrad realised that privacy technologies are not enough and now advocates for self-sovereign crypto networks and the realisation of a latent cypherpunk dream, the cryptostate. As the co-founder of Logos, Jarrad uses his experience to build censorship-resistant governance infrastructure. On these technical foundations, Logos is building a viable alternative to the nation state that addresses many of the faults of the current system.',
    ],
  },
  {
    name: 'Peter Ludlow',
    image: '/book/peter-ludlow.webp',
    text: [
      'Peter Ludlow entered the world of philosophy through a deep interest in linguistics, the philosophy of language and digital technologies. His early work in artificial intelligence and natural language processing showed him the cooperative part of language comprehension - an idea explored in his book, Living Words. This led him to make significant contributions to our understanding of how meaning is a shared, collaborative enterprise.',
      'As a leading voice in the philosophy of mind and language, Peter has authored and contributed to influential works on the intersection of technology and society, including the seminal anthology on how cyberspace is poised to impact human organisation, Crypto Anarchy, Cyberstates, and Pirate Utopias. His current focus is on the potential for digital platforms to foster self-sovereign communities and new, decentralised-yet-collaborative social orders.',
    ],
  },
] as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pages.book' })
  return createDefaultMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: ROUTES.book,
  })
}

function BookAction({
  label,
  subtext,
  href,
  external,
}: {
  label: string
  subtext: string
  href: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="inline-flex min-w-[150px] items-center justify-between gap-4 rounded-xl bg-brand-off-white px-4 py-3 text-brand-dark-green transition-colors hover:bg-gray-01 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-off-white"
    >
      <span className="flex flex-col">
        <span className="font-mono text-[10px] font-semibold uppercase leading-[1.35]">
          {label}
        </span>
        <span className="font-mono text-[9px] leading-[1.35] opacity-60">
          {subtext}
        </span>
      </span>
      <IconMask src="/icons/right-arrow.svg" className="size-[15px]" />
    </a>
  )
}

function ActionGroup({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap justify-center gap-3 ${className}`}>
      {actions.map((action) => (
        <BookAction key={action.label} {...action} />
      ))}
    </div>
  )
}

export default async function BookPage() {
  return (
    <main className="bg-brand-off-white text-brand-dark-green">
      <section className="relative min-h-screen overflow-hidden pt-10">
        <Image
          src="/book/farewell-hero.jpg"
          alt="Farewell to Westphalia banner"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-brand-dark-green/35" />
        <div className="relative z-10 flex min-h-[calc(100vh-40px)] flex-col items-center justify-end px-3 pb-16 text-center text-brand-off-white">
          <h1 className="max-w-5xl font-display text-[56px] leading-none tracking-[-0.03em] md:text-[104px]">
            Farewell to Westphalia
          </h1>
          <p className="mt-6 max-w-2xl font-sans text-[18px] leading-[1.2] md:text-[22px]">
            A book co-authored by Logos co-founder Jarrad Hope and Peter Ludlow
            that explores crypto sovereignty and post-nation-state governance
          </p>
          <ActionGroup className="mt-8" />
        </div>
      </section>

      <section className="grid gap-3 border-t border-brand-dark-green/10 px-3 py-16 md:grid-cols-12 md:py-24">
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
      </section>

      <section className="border-t border-brand-dark-green/10">
        {authors.map((author, index) => (
          <div
            key={author.name}
            className="grid gap-3 border-b border-brand-dark-green/10 px-3 py-16 md:grid-cols-12 md:py-24"
          >
            <div
              className={
                index % 2 === 0
                  ? 'md:col-span-5'
                  : 'md:col-span-5 md:col-start-8 md:row-start-1'
              }
            >
              <div className="relative aspect-square overflow-hidden rounded">
                <Image
                  src={author.image}
                  alt={author.name}
                  fill
                  sizes="(min-width: 768px) 42vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div
              className={
                index % 2 === 0
                  ? 'flex flex-col justify-center md:col-span-5 md:col-start-8'
                  : 'flex flex-col justify-center md:col-span-5 md:col-start-2 md:row-start-1'
              }
            >
              <h2 className="font-display text-[42px] leading-none tracking-[-0.03em] md:text-[64px]">
                {author.name}
              </h2>
              <div className="mt-8 space-y-5 font-sans text-[16px] leading-[1.25]">
                {author.text.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="border-t border-brand-dark-green/10 px-3 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="relative aspect-video overflow-hidden rounded bg-brand-dark-green">
            <iframe
              src="https://www.youtube.com/embed/T0kNpazXeWU"
              title="Farewell to Westphalia video"
              className="absolute inset-0 size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section
        id="translations"
        className="relative mx-3 overflow-hidden rounded py-24 text-center text-brand-off-white md:py-36"
      >
        <Image
          src="/book/translations-bg.webp"
          alt="Farewell gradient"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="relative z-10 mx-auto max-w-4xl px-3">
          <h2 className="font-display text-[44px] leading-none tracking-[-0.03em] md:text-[72px]">
            Community Translations
          </h2>
          <div className="mt-8 flex justify-center">
            <BookAction
              label="PDF ebook (Spanish)"
              subtext="available FREE here"
              href="/book/farewell-to-westphalia-spanish.pdf"
              external
            />
          </div>
        </div>
      </section>

      <section className="relative mx-3 mt-3 overflow-hidden rounded py-24 text-center text-brand-off-white md:py-36">
        <Image
          src="/book/read-bg.webp"
          alt="Farewell gradient"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="relative z-10 mx-auto max-w-4xl px-3">
          <h2 className="font-display text-[44px] leading-none tracking-[-0.03em] md:text-[72px]">
            Read the book now
          </h2>
          <ActionGroup className="mt-8" />
        </div>
      </section>
    </main>
  )
}
