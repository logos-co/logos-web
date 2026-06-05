/**
 * Shared copy shapes for the Research page sections. Each section file imports
 * the slice it renders (e.g. `ResourceItem[]`, `ContributeCopy`).
 */
export type LinkItem = {
  label: string
  href: string
}

export type ResourceItem = LinkItem & {
  number: string
  /** Optional per-item CTA label; falls back to the shared "Learn more" label. */
  cta?: string
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
