import type { LambdaPrizeCopySection } from '@repo/content/schemas'

import { Lines } from './atoms'
import { Picture } from './picture'

export function Ownership({
  copy,
}: {
  copy: LambdaPrizeCopySection['ownership']
}) {
  return (
    <section className="lp-ownership" aria-labelledby="ownership-heading">
      <p className="lp-eyebrow">{copy.eyebrow}</p>
      <h2 id="ownership-heading" className="lp-display lp-manifesto">
        {copy.lines.map((line, index) => (
          <span className="lp-manifesto-line" key={index}>
            <span className="lp-manifesto-before">{line.before.trimEnd()}</span>
            <span className="lp-manifesto-image">
              <Picture
                image={line.image}
                sizes="(min-width: 1440px) 200px, 96px"
              />
            </span>
            <span className="lp-manifesto-after">{line.after}</span>
          </span>
        ))}
      </h2>
      <p className="lp-body lp-ownership-body">
        <Lines>{copy.body}</Lines>
      </p>
      <aside className="lp-next-round">
        <h3 className="lp-sans-title">{copy.nextRound.title}</h3>
        <p className="lp-small">
          <Lines>{copy.nextRound.body}</Lines>
        </p>
      </aside>
    </section>
  )
}
