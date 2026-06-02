import { Authors } from './authors'
import { Hero } from './hero'
import { Overview } from './overview'
import { ReadTheBook } from './read-the-book'
import { Translations } from './translations'
import { Video } from './video'

export function BookPage() {
  return (
    <main className="bg-brand-off-white text-brand-dark-green">
      <Hero />
      <Overview />
      <Authors />
      <Video />
      <Translations />
      <ReadTheBook />
    </main>
  )
}
