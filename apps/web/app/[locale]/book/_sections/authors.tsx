import Image from 'next/image'

import ContentWidth from '@/components/layout/content-width'

import type { BookAuthor } from './types'

const authors: readonly BookAuthor[] = [
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

export function Authors() {
  return (
    <section className="border-t border-brand-dark-green/10">
      {authors.map((author, index) => (
        <div
          key={author.name}
          className="border-b border-brand-dark-green/10 px-3 py-16 md:py-24"
        >
          <ContentWidth className="grid gap-3 md:grid-cols-12">
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
          </ContentWidth>
        </div>
      ))}
    </section>
  )
}
