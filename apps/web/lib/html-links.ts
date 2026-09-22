import { ROUTES } from '@/constants/routes'

const ANCHOR_TAG = /<a\b([^>]*)>/gi
const HREF_ATTR = /(^|\s)href\s*=\s*(["']?)\s*([^"'\s>]*)/i
const TARGET_ATTR = /(?:^|\s)target\s*=/i
const REL_ATTR = /(^|\s)rel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i
/** In-page anchors, other pages of the site and mail/phone links stay put. */
const SAME_TAB_HREF = /^(#|\/(?!\/)|mailto:|tel:)/i
const NEW_TAB_REL = ['noopener', 'noreferrer']
/** The old blog and press.logos.co, the older name that forwards to it. */
const LEGACY_BLOG_HOSTS = new Set(['blog.logos.co', 'press.logos.co'])

/**
 * The page an old blog link now lives at, or null for any other link. Editors
 * linked posts to each other with blog URLs, and that site is being switched
 * off. Mirrors the redirect map in docs/media-migration-redirects.md.
 */
function mediaPathForLegacyBlogUrl(href: string): string | null {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }
  if (!LEGACY_BLOG_HOSTS.has(url.hostname)) return null

  const [section, first, second] = url.pathname.split('/').filter(Boolean)
  if (section === 'article' && first) {
    return `${ROUTES.mediaArticle(first)}${url.hash}`
  }
  if (section === 'podcasts' && first && second) {
    return `${ROUTES.mediaPodcast(first, second)}${url.hash}`
  }
  if (section === 'podcasts') return ROUTES.mediaPodcastsSection
  if (section === 'calendar') return ROUTES.logosBroadcastNetwork
  return ROUTES.media
}

function withNewTabRel(attrs: string): string {
  const rel = REL_ATTR.exec(attrs)
  if (!rel) return ` rel="${NEW_TAB_REL.join(' ')}"${attrs}`

  const current = (rel[2] ?? rel[3] ?? rel[4] ?? '').split(/\s+/)
  const tokens = [...new Set([...current, ...NEW_TAB_REL].filter(Boolean))]
  return attrs.replace(
    REL_ATTR,
    (_, space: string) => `${space}rel="${tokens.join(' ')}"`
  )
}

/**
 * Prepares the links in a CMS or forum HTML fragment: old blog links point at
 * their /media page, and links that leave the site open in a new tab.
 */
export function prepareCmsLinks(html: string): string {
  return html.replace(ANCHOR_TAG, (tag, attrs: string) => {
    const href = HREF_ATTR.exec(attrs)?.[3]
    if (href === undefined) return tag

    const mediaPath = mediaPathForLegacyBlogUrl(href)
    if (mediaPath) {
      const rewritten = attrs.replace(
        HREF_ATTR,
        (_, space: string, quote: string) => `${space}href=${quote}${mediaPath}`
      )
      return `<a${rewritten}>`
    }

    if (SAME_TAB_HREF.test(href) || TARGET_ATTR.test(attrs)) return tag
    return `<a target="_blank"${withNewTabRel(attrs)}>`
  })
}
