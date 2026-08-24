import type { Metadata } from 'next'

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
import { TypewriterArmingScript } from './_sections/typewriter'
import {
  createCampaignArticleJsonLd,
  createCampaignBreadcrumbJsonLd,
  JsonLd,
  PAGE_KEYWORDS,
} from './_structured-data'

const ROUTE = ROUTES.catchNoOne

const TITLE = 'Check everyone to catch no one | Logos'
// Kept under ~160 characters so search results show it whole. The longer
// framing lives in the page's own opening paragraph.
const DESCRIPTION =
  'EU and UK child-safety proposals could come at a significant cost to privacy and security. Here’s what leading researchers have found.'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`generateMetadata received non-active locale "${locale}"`)
  }
  const metadata = await createDefaultMetadata({
    title: TITLE,
    description: DESCRIPTION,
    keywords: [...PAGE_KEYWORDS],
    locale,
    path: ROUTE,
  })

  // The site default is `website`; this page is a sourced long-form piece, the
  // same as the other campaign page.
  const openGraph: Metadata['openGraph'] = {
    ...metadata.openGraph,
    type: 'article',
  }

  return { ...metadata, openGraph }
}

export default async function CatchNoOnePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`CatchNoOnePage received non-active locale "${locale}"`)
  }

  return (
    // An <article>: the page is one long sourced argument, not a set of
    // unrelated panels.
    <article className="overflow-x-clip bg-brand-off-white text-brand-dark-green">
      <JsonLd data={createCampaignArticleJsonLd(locale)} />
      <JsonLd data={createCampaignBreadcrumbJsonLd(locale)} />
      {/*
        Must stay above the first animated string — it runs while the parser is
        still here, which is what keeps the server-rendered text from flashing
        before a quote card types itself in.
      */}
      <TypewriterArmingScript />
      <Hero />
      <LawsPromise />
      <DoesNotCatch />
      <WeAllPay />
      <RightQuestion />
      <WhatItTakes />
      <CaseFile />
    </article>
  )
}
