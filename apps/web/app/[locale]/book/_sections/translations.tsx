import Image from 'next/image'

import { BOOK_DOWNLOADS } from '@/constants/book-assets'

import { BookAction } from './atoms'

export function Translations() {
  return (
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
            href={BOOK_DOWNLOADS.spanish}
            external
          />
        </div>
      </div>
    </section>
  )
}
