import Image from 'next/image'
import type { MusterCopySection } from '@repo/content/schemas'

import { Button } from '@/components/ui'

import { InstallButton } from './install-button'
import { Paragraphs } from './shared'

export function Build({ copy }: { copy: MusterCopySection['build'] }) {
  return (
    <section id="build-on-logos" className="muster-section muster-build">
      <div className="muster-container muster-split">
        <div className="muster-build-heading">
          <h2 className="muster-heading">
            {copy.title[0]}
            <br />
            {copy.title[1]}
          </h2>
          <Paragraphs body={copy.body} />
        </div>
        <Image
          {...copy.image}
          className="muster-photo muster-build-photo"
          sizes="(min-width: 768px) 50vw, 100vw"
          data-muster-reveal
        />
        <article className="muster-build-card muster-dark">
          <h3 className="muster-subheading">{copy.install.title}</h3>
          <p>{copy.install.body}</p>
          <div className="muster-actions">
            <InstallButton cta={copy.install.cta} />
          </div>
        </article>
        {copy.cards.map(({ title, body, ctas }) => (
          <article className="muster-build-card" key={title}>
            <h3 className="muster-subheading">{title}</h3>
            <p>{body}</p>
            <div className="muster-actions">
              {ctas.map(({ label, href }) => (
                <Button key={href} href={href} className="muster-button">
                  {label}
                </Button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
