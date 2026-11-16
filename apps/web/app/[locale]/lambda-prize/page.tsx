import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { loadLambdaProgramme } from '@/lib/lambda-programme'

import { programmeMono } from '../developer-programmes/fonts'
import { LambdaPrizePage } from './_sections/lambda-prize-page'
import './lambda-prize.css'
import './responsive.css'
import './mobile.css'

export const generateMetadata = createPageMetadata(ROUTES.lambdaPrize)

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale))
    throw new Error(`LambdaPrizePage received non-active locale "${locale}"`)
  const programme = await loadLambdaProgramme(locale)
  return (
    <div
      className={`lambda-prize text-small-compact ${programmeMono.variable}`}
    >
      <LambdaPrizePage programme={programme} />
    </div>
  )
}
