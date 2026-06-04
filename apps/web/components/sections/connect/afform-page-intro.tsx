import type { ReactNode } from 'react'

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g

function renderInlineLinks(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  LINK_PATTERN.lastIndex = 0
  while ((match = LINK_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    nodes.push(
      <a
        key={`${match.index}-${match[1]}`}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer underline hover:no-underline"
      >
        {match[1]}
      </a>
    )

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [text]
}

type Props = {
  text: string
}

export function AfformPageIntro({ text }: Props) {
  const paragraphs = text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <div className="mx-auto max-w-[40em] space-y-4 text-balance font-mono text-[10px] leading-[1.3]">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{renderInlineLinks(paragraph)}</p>
      ))}
    </div>
  )
}
