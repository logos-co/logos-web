import type { FieldStationCaseStudyCopySection } from '@repo/content/schemas'

import { Photo } from './shared'
import { rhymesText } from './fonts'

export function Testimonial({
  copy,
}: {
  copy: FieldStationCaseStudyCopySection['testimonial']
}) {
  return (
    <figure
      className={`field-case-testimonial ${rhymesText.variable}`}
      data-header-tone="dark"
    >
      <Photo
        image={copy.image}
        sizes="(max-width: 767px) 1072px, 100vw"
        fullWidth
        reveal
      />
      {copy.quotes.map((item) => (
        <blockquote key={item.attribution}>
          <p>{item.quote}</p>
          <footer>{item.attribution}</footer>
        </blockquote>
      ))}
    </figure>
  )
}
