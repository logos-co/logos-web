import type { DeveloperProgrammesCopySection } from '@repo/content/schemas'
import { Cta } from './atoms'

export function Resources({
  copy,
}: {
  copy: DeveloperProgrammesCopySection['resources']
}) {
  return (
    <section className="dp-resources">
      <h2>{copy.heading}</h2>
      <ol>
        {copy.items.map((item, index) => (
          <li key={item.title}>
            <span className="dp-mono">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3>{item.title}</h3>
            <p className="dp-mono">{item.body}</p>
            <Cta link={item.cta} variant="tertiary" />
          </li>
        ))}
      </ol>
    </section>
  )
}
