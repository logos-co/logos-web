const ANCHOR_TAG = /<a\b([^>]*)>/gi
const HREF_ATTR = /(?:^|\s)href\s*=\s*["']?\s*([^"'\s>]*)/i
const TARGET_ATTR = /(?:^|\s)target\s*=/i
const REL_ATTR = /(^|\s)rel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i
/** In-page anchors (footnotes, headings) and mail/phone links stay put. */
const STAY_IN_PAGE_HREF = /^(#|mailto:|tel:)/i
const NEW_TAB_REL = ['noopener', 'noreferrer']

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

/** Opens every outbound link in a CMS or forum HTML fragment in a new tab. */
export function addTargetBlank(html: string): string {
  return html.replace(ANCHOR_TAG, (tag, attrs: string) => {
    const href = HREF_ATTR.exec(attrs)?.[1]
    if (
      href === undefined ||
      STAY_IN_PAGE_HREF.test(href) ||
      TARGET_ATTR.test(attrs)
    ) {
      return tag
    }
    return `<a target="_blank"${withNewTabRel(attrs)}>`
  })
}
