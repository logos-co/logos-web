import Image from 'next/image'
import type { MusterCopySection } from '@repo/content/schemas'

import { Paragraphs } from './shared'

export function Modules({ copy }: { copy: MusterCopySection['modules'] }) {
  return (
    <section className="muster-section muster-modules">
      <div className="muster-container">
        <h2 className="muster-heading">{copy.title}</h2>
        <div className="muster-split">
          <Paragraphs body={copy.body} />
          <dl className="muster-module-cards">
            {copy.entries.map(({ title, body }) => (
              <div key={title} className="muster-module-card">
                <dt>{title}</dt>
                <dd>{body}</dd>
              </div>
            ))}
          </dl>
        </div>
        <Image
          {...copy.image}
          className="muster-photo muster-modules-photo"
          sizes="100vw"
          data-muster-reveal
        />
      </div>
    </section>
  )
}
