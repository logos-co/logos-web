/**
 * Shared copy shapes for the Lambda Prize page sections. Each section file
 * imports the slice it renders (e.g. `LambdaPrizePageCopy['hero']`).
 */
export interface RowCopy {
  label: string
  body: string
}

export interface PrizeCopy {
  meta: string[]
  title: string
  body: string
  status: string
  href: string
}

export interface SupportRowCopy extends RowCopy {
  action: string
  href?: string
}

export interface LambdaPrizePageCopy {
  hero: {
    label: string
    heading: string
    body: string
    primaryCta: string
    secondaryCta: string
  }
  howItWorks: {
    heading: string
    rows: RowCopy[]
  }
  evaluation: {
    heading: string
    rows: RowCopy[]
    primaryCta: string
    secondaryCta: string
  }
  featured: {
    heading: string
    prizes: PrizeCopy[]
  }
  about: {
    heading: string
    body: string
    primaryCta: string
    secondaryCta: string
    rows: RowCopy[]
  }
  techStack: {
    startBuildingCta: string
    docsCta: string
  }
  support: {
    heading: string
    body: string
    cta: string
    ctaHref?: string
    rows: SupportRowCopy[]
  }
}
