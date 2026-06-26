import Markdown, { type Components } from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import { Link } from '@/i18n/navigation'

/**
 * Renders a Field Guide chapter body (Markdown) into the `.fg-article` element
 * provided by `FieldGuideShell`. Styling comes entirely from the ported
 * `field-guide.css` (element selectors under `.fg-article`), so the output is
 * visually identical to the reference site. `rehype-raw` renders the raw HTML
 * the source contains (headerless tables, `<kbd>`, `<strong>`); only internal
 * links are remapped to the i18n `Link` for client-side navigation.
 */

// Internal app route: absolute path with no file extension (e.g.
// `/field-guide/why-logos`). Static assets such as `/field-guide/img/x.png`
// are intentionally excluded so they render as plain anchors, not router links.
const isInternalRoute = (href: string | undefined): href is string =>
  typeof href === 'string' &&
  href.startsWith('/') &&
  !/\.[a-z0-9]+(?:[?#]|$)/i.test(href)

const isExternalHref = (href: string | undefined): href is string =>
  typeof href === 'string' && /^https?:\/\//.test(href)

const components: Components = {
  a: ({ href, children }) => {
    // Internal app routes use the i18n Link for client-side navigation.
    if (isInternalRoute(href)) {
      return <Link href={href}>{children}</Link>
    }
    // Only genuine http(s) URLs open in a new tab; asset/hash/relative/mailto
    // links render as plain anchors (matching legal-markdown.tsx behaviour).
    if (isExternalHref(href)) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    }
    return <a href={href}>{children}</a>
  },
}

interface FieldGuideContentProps {
  /** Raw Markdown chapter body. */
  body: string
}

export function FieldGuideContent({ body }: FieldGuideContentProps) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={components}
    >
      {body}
    </Markdown>
  )
}
