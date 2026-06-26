import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Link } from '@/i18n/navigation'

/**
 * Renders a Field Guide chapter body (Markdown) with the Logos reading
 * typography. Each Markdown element maps to the design system's tokens so the
 * ported guide matches the site's look. Internal links (starting with "/")
 * route through the i18n `Link`; external links open in a new tab.
 *
 * Pure render, no client state — safe to render on the server and pass as
 * children into the client `FieldGuideShell`.
 */

const isInternalHref = (href: string | undefined): href is string =>
  typeof href === 'string' && href.startsWith('/')

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-h2 mt-0 w-full text-brand-dark-green">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-h4-serif mt-8 w-full text-brand-dark-green">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-subhead-serif mt-6 w-full text-brand-dark-green">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-body-sans leading-relaxed text-brand-dark-green">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="text-body-sans list-disc space-y-2 pl-5 text-brand-dark-green">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-body-sans list-decimal space-y-2 pl-5 text-brand-dark-green">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="text-subhead-serif border-l-2 border-brand-dark-green pl-4 text-brand-dark-green italic">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="w-full overflow-x-auto">
      <table className="text-body-sans w-full border-collapse text-left text-brand-dark-green">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-brand-dark-green/30">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="text-eyebrow px-3 py-2 align-top font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-brand-dark-green/10 px-3 py-2 align-top">
      {children}
    </td>
  ),
  hr: () => <hr className="border-brand-dark-green/20" />,
  code: ({ children }) => (
    <code className="rounded bg-gray-01 px-1 py-0.5 font-mono text-[0.9em]">
      {children}
    </code>
  ),
  strong: ({ children }) => (
    <strong className="font-medium">{children}</strong>
  ),
  a: ({ href, children }) => {
    if (isInternalHref(href)) {
      return (
        <Link
          href={href}
          className="underline underline-offset-2 transition-opacity hover:opacity-60"
        >
          {children}
        </Link>
      )
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 transition-opacity hover:opacity-60 [overflow-wrap:anywhere]"
      >
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
    <div className="flex w-full flex-col gap-4">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {body}
      </Markdown>
    </div>
  )
}
