import type { FieldStationCaseStudyCopySection } from '@repo/content/schemas'
import { Paragraphs, Photo } from './shared'

export function Story({
  basics,
  community,
}: Pick<FieldStationCaseStudyCopySection, 'basics' | 'community'>) {
  return (
    <>
      <section className="field-case-section">
        <div className="field-case-split field-case-basics">
          <h2>{basics.title}</h2>
          <Paragraphs body={basics.body} />
          <Photo image={basics.image} />
        </div>
        <div className="field-case-tracks">
          <h3>{basics.label}</h3>
          <div className="field-case-grid-four">
            {basics.tracks.map((track) => (
              <article key={track.title}>
                <h4>{track.title}</h4>
                <p>{track.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="field-case-section field-case-grey">
        <div className="field-case-split">
          <h2>{community.title}</h2>
          <Paragraphs body={community.body} />
        </div>
        <div className="field-case-split field-case-statement">
          <h2>{community.statement}</h2>
          <Paragraphs body={community.details} />
        </div>
        <div className="field-case-split field-case-photos">
          {community.images.map((image) => (
            <Photo key={image.src} image={image} />
          ))}
        </div>
      </section>
    </>
  )
}
