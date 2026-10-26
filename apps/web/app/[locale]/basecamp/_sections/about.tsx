import type { Renewal } from './atoms'
import { Lines } from './atoms'

export function About({ copy }: { copy: Renewal['about'] }) {
  return (
    <section id="about" className="bc-about">
      <div className="bc-about-row">
        <h2>
          <Lines lines={copy.title} />
        </h2>
        <div className="bc-about-body">
          {copy.paragraphs.map((lines, index) => (
            <p key={index}>
              <Lines lines={lines} />
            </p>
          ))}
        </div>
      </div>
      <div className="bc-stats">
        {copy.stats.map((stat) => (
          <div key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
