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
      <p className="dp-hero-subtitle dp-desktop-only">
        <Copy>{copy.subtitle}</Copy>
      </p>
      <div className="dp-mobile-hero-subtitle dp-mobile-only">
        <p>
          <Copy markSize={17.2} fontSize={20}>
            {copy.subtitle}
          </Copy>
        </p>
      </div>
      <p className="dp-hero-body dp-lines">
        <Copy inline markSize={10.64} fontSize={14}>
          {copy.body}
        </Copy>
      </p>
    </section>
  )
}
