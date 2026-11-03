import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { LambdaPrizeCopySection } from '@repo/content/schemas'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

import { programmeMono } from '../developer-programmes/fonts'
import { LambdaPrizePage } from './_sections/lambda-prize-page'
import './lambda-prize.css'
import './responsive.css'
import './mobile.css'

export const generateMetadata = createPageMetadata(ROUTES.lambdaPrize)
const findSection = createSectionFinder('lambda-prize')

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale))
    throw new Error(`LambdaPrizePage received non-active locale "${locale}"`)
  const page = await getPageCopy(ROUTES.lambdaPrize, locale)
  const copy = findSection<LambdaPrizeCopySection>(
    page.sections,
    'lambdaPrizeCopy',
    'lambdaPrize.copy'
  )
  return (
    <div
      className={`lambda-prize text-small-compact ${programmeMono.variable}`}
    >
      <LambdaPrizePage copy={copy} />
    </div>
  )
}
