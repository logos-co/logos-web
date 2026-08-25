import { Fragment, type ReactNode } from 'react'

import type { BlockNode, InlineNode } from '@/contracts/rich-text'
import { parseRichText } from '@/contracts/rich-text'

/**
 * Renders a note as React elements.
 *
 * There is no `dangerouslySetInnerHTML` anywhere in this file, and that is the
 * point: notes carry text pasted from applicants and strangers, so the renderer
 * is built so that the worst a hostile note can do is look wrong.
 */
function renderInline(nodes: readonly InlineNode[]): ReactNode {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'text':
        return <Fragment key={index}>{node.value}</Fragment>
      case 'strong':
        return <strong key={index}>{renderInline(node.children)}</strong>
      case 'emphasis':
        return <em key={index}>{renderInline(node.children)}</em>
      case 'code':
        return <code key={index}>{node.value}</code>
      case 'link':
        return (
          <a
            className="cursor-pointer"
            href={node.href}
            key={index}
            // A note can link anywhere. `noreferrer` keeps the CRM's URL, which
            // identifies a case, out of the destination's logs.
            rel="noreferrer noopener"
            target="_blank"
          >
            {renderInline(node.children)}
          </a>
        )
      case 'image':
        return (
          // A plain img rather than next/image: the src is whatever somebody
          // pasted into a note, and the optimiser would need every host
          // allow-listed in advance, which is not a list anybody can keep.
          <img
            alt={node.alt}
            className="note-image"
            key={index}
            loading="lazy"
            referrerPolicy="no-referrer"
            src={node.href}
          />
        )
    }
  })
}

function renderBlock(node: BlockNode, index: number): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return <p key={index}>{renderInline(node.children)}</p>
    case 'heading':
      return node.level === 2 ? (
        <h4 key={index}>{renderInline(node.children)}</h4>
      ) : (
        <h5 key={index}>{renderInline(node.children)}</h5>
      )
    case 'quote':
      return <blockquote key={index}>{renderInline(node.children)}</blockquote>
    case 'list':
      return node.ordered ? (
        <ol key={index}>
          {node.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ol>
      ) : (
        <ul key={index}>
          {node.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ul>
      )
  }
}

export function RichTextView({ body }: { body: string }) {
  const blocks = parseRichText(body)

  return (
    <div className="rich-text">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  )
}
