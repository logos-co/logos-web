import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { BookCopySection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

import { BookPage } from './_sections/book-page'

const ROUTE = ROUTES.book

const findSection = createSectionFinder('book')

export const generateMetadata = createPageMetadata(ROUTE)

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`BookPage received non-active locale "${locale}"`)
  }

  const page = await getPageCopy(ROUTE, locale)

  const bookCopy = findSection<BookCopySection>(
    page.sections,
    'bookCopy',
    'book.copy',
  )

  return <BookPage data={bookCopy} />
}
