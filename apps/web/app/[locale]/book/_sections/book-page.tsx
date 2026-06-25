import type { BookCopySection } from '@repo/content/schemas'

import { Authors } from './authors'
import { Hero } from './hero'
import { Overview } from './overview'
import { ReadTheBook } from './read-the-book'
import { Translations } from './translations'
import { Video } from './video'

interface BookPageProps {
  data: BookCopySection
}

export function BookPage({ data }: BookPageProps) {
  return (
    <main className="bg-brand-off-white text-brand-dark-green">
      <Hero heading={data.heading} />
      <Overview />
      <Authors />
      <Video />
      <Translations />
      <ReadTheBook />
    </main>
  )
}
