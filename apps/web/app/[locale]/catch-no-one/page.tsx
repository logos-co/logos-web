import { isActiveLocale } from '@repo/content/locales'

import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'

import {
  CaseFile,
  DoesNotCatch,
  Hero,
  LawsPromise,
  RightQuestion,
  WeAllPay,
  WhatItTakes,
} from './_sections'

const ROUTE = ROUTES.catchNoOne

const TITLE = 'Check everyone to catch no one | Logos'
const DESCRIPTION =
  "Two measures being advanced in the EU and UK promise to protect children by checking everyone's private communications or age. The cryptographers and security researchers who build these systems say they will not catch the offenders they target, and that everyone else bears the cost."

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`generateMetadata received non-active locale "${locale}"`)
  }
  return createDefaultMetadata({
    title: TITLE,
    description: DESCRIPTION,
    locale,
    path: ROUTE,
  })
}

export default function CatchNoOnePage() {
  return (
    <div className="overflow-x-clip bg-brand-off-white text-brand-dark-green">
      <Hero />
      <LawsPromise />
      <DoesNotCatch />
      <WeAllPay />
      <RightQuestion />
      <WhatItTakes />
      <CaseFile />
    </div>
  )
}
