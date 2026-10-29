import type { DeveloperProgrammesCopySection } from '@repo/content/schemas'
import { Copy } from './atoms'

export function Hero({
  copy,
}: {
  copy: DeveloperProgrammesCopySection['hero']
}) {
  return (
    <section className="dp-hero">
      <p className="dp-eyebrow">{copy.eyebrow}</p>
      <h1 className="dp-hero-title">{copy.title}</h1>
      <p className="dp-hero-subtitle">
        <Copy>{copy.subtitle}</Copy>
      </p>
      <p className="dp-hero-body dp-lines">
        <Copy inline markSize={10.64} fontSize={14}>
          {copy.body}
        </Copy>
      </p>
    </section>
  )
}
