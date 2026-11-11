import type { MusterCopySection } from '@repo/content/schemas'

import { LogosLockup, MusterLockup, Paragraphs } from './shared'

export function Basics({
  copy,
  brand,
  project,
}: {
  copy: MusterCopySection['basics']
  brand: string
  project: string
}) {
  return (
    <section className="muster-section muster-basics">
      <div className="muster-container">
        <MusterLockup project={project} />
        <div className="muster-split muster-basics-row">
          <div>
            <h2 className="muster-subheading">{copy.room.title}</h2>
            <Paragraphs body={copy.room.body} />
          </div>
          <dl className="muster-basics-list muster-basics-steps">
            {copy.room.steps.map(({ title, body }) => (
              <div key={title}>
                <dt className="muster-mono">{title}</dt>
                <dd>{body}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="muster-basics-divider">
          <LogosLockup brand={brand} size={24} />
          <div className="muster-split muster-basics-row">
            <div>
              <h2 className="muster-subheading">{copy.basecamp.title}</h2>
              <Paragraphs body={copy.basecamp.body} />
            </div>
            <dl className="muster-basics-list">
              {copy.basecamp.features.map(({ title, body }) => (
                <div key={title}>
                  <dt>{title}</dt>
                  <dd>{body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <p className="muster-heading muster-statement" data-muster-reveal>
          {copy.statement[0]} <br />
          {copy.statement[1]}
        </p>
      </div>
    </section>
  )
}
