import type { DeveloperProgrammesCopySection } from '@repo/content/schemas'

export function Principles({
  copy,
}: {
  copy: DeveloperProgrammesCopySection['principles']
}) {
  return (
    <section className="dp-principles">
      <h2>{copy.heading}</h2>
      <ol>
        {copy.items.map((item, index) => (
          <li key={item.title}>
            <span className="dp-eyebrow">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3>{item.title}</h3>
            <p className="dp-lines">{item.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
