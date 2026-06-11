import type { Metadata } from 'next'

import siteConfig from '@/constants/site-config'

import UkDebtContent from './UkDebtContent'

const OG_IMAGE = '/campaigns/ukdebt/og-image.jpg'
const TITLE = 'UK Debt Crisis: Act Now | Logos'
const DESCRIPTION =
  "The UK's debt is costing £114 billion in annual interest producing nothing. That's money that could fund public services, affordable housing, and robust community infrastructure. It's time to do something about it."

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url.replace(/\/+$/, '')),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/ukdebt',
    type: 'article',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: DESCRIPTION,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
}

export default function UkDebtPage() {
  return <UkDebtContent />
}
