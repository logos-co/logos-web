import Image from 'next/image'
import type { MusterCopySection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

import { assetPath, Paragraphs } from './shared'

export function Prifi({ copy }: { copy: MusterCopySection['prifi'] }) {
  return (
    <section className="muster-section muster-grey muster-prifi">
      <div className="muster-container">
        <div className="muster-split muster-section-intro">
          <h2 className="muster-heading">{copy.title}</h2>
          <Paragraphs body={copy.body} />
        </div>
        <div className="muster-prifi-graphic" data-muster-reveal>
          <ol className="muster-prifi-stages">
            {copy.stages.map((stage, index) => (
              <li key={stage}>
                {stage}
                <Image
                  src={`${assetPath}/${index < 5 ? 'stage-node' : 'development-node'}.svg`}
                  width={7}
                  height={7}
                  alt=""
                />
              </li>
            ))}
          </ol>
          <div className="muster-prifi-cards">
            {copy.cards.map(({ label, title, body }) => (
              <div className="muster-prifi-card" key={label}>
                <p className="muster-mono">{label}</p>
                <h3 className="muster-subheading">{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
        <Button href={copy.cta.href} className="muster-button muster-prifi-cta">
          {copy.cta.label}
        </Button>
      </div>
    </section>
  )
}
