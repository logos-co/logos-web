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

const isInternalHref = (href: string | undefined): href is string =>
  typeof href === 'string' && href.startsWith('/')

const components: Components = {
  a: ({ href, children }) => {
    if (isInternalHref(href)) {
      return <Link href={href}>{children}</Link>
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
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
