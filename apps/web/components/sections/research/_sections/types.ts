/**
 * Shared copy shapes for the Research page sections. Each section file imports
 * the slice it renders (e.g. `ResourceItem[]`, `OverviewCopy`).
 */
export type LinkItem = {
  label: string
  href: string
}

export type ResourceItem = LinkItem & {
  number: string
}

export type OverviewCopy = {
  paragraphs: string[]
}

export type ContributeCopy = {
  howTitle: string
  contact: string
  jobs: string
  links: {
    discord: string
    forum: string
    github: string
    jobs: string
  }
  whatTitle: string
  whatBody: string
  codeIntro: string
  codeLinks: LinkItem[]
}
