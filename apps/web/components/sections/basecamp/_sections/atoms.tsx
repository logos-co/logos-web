/**
 * Shared presentational atoms and helpers for the Basecamp page sections.
 */

export function paragraphs(value?: string) {
  if (!value) return []
  return value.split('\n\n').filter(Boolean)
}

export function BodyDetailBlock({ text }: { text: string }) {
  const lines = text.split('\n').filter(Boolean)

  if (lines.length <= 1) {
    return <p className="whitespace-pre-line">{text}</p>
  }

  return (
    <div className="flex flex-col">
      {lines.map((line) => (
        <p key={line} className="font-semibold uppercase">
          {line}
        </p>
      ))}
    </div>
  )
}
