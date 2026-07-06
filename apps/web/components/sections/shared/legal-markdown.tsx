import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/cn'

/**
 * Renders markdown-managed legal / info documents (terms, privacy, security,
 * testnet FAQs) with the Logos docs typography. Each HTML element produced by
 * the markdown is mapped to the design system's tokens so the output matches
 * the look of the previous hand-styled legal pages while supporting real
 * markdown structure (headings, lists, links).
 *
 * Links to external URLs open in a new tab; everything renders statically
 * (no client interactivity), so this stays a server component.
 */

const isExternalHref = (href: string | undefined): boolean =>
  typeof href === 'string' && /^https?:\/\//.test(href)

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-2 w-full font-display text-[30px] leading-none tracking-normal text-brand-dark-green first:mt-0 md:text-[36px]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-h4-serif mt-6 w-full text-brand-dark-green first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-body-serif mt-4 w-full text-brand-dark-green">
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc space-y-2 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-2 pl-5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="underline underline-offset-2 transition-opacity hover:opacity-60 [overflow-wrap:anywhere]"
      {...(isExternalHref(href)
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {})}
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-medium">{children}</strong>,
}

interface LegalMarkdownProps {
  /** Raw markdown body (frontmatter already stripped by the loader). */
  body: string
  className?: string
}

export function LegalMarkdown({ body, className }: LegalMarkdownProps) {
  return (
    <div
      className={cn(
        'text-mono-s flex w-full flex-col gap-4 text-brand-dark-green',
        className
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {body}
      </Markdown>
    </div>
  )
}
