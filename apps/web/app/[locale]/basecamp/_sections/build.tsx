import Image from 'next/image'
import type { Renewal } from './atoms'
import { asset, Lines, LinkButton } from './atoms'

export function Build({ copy }: { copy: Renewal['build'] }) {
  return (
    <section id="build-an-app" className="bc-build">
      <div className="bc-build-top">
        <div>
          <h2>
            <Lines lines={copy.title} />
          </h2>
          <p>{copy.description}</p>
          <div className="bc-actions">
            <LinkButton href={copy.docs.href} className="bc-button-orange">
              {copy.docs.label}
            </LinkButton>
            <LinkButton
              href={copy.tutorials.href}
              className="bc-button-outline"
            >
              {copy.tutorials.label}
            </LinkButton>
          </div>
        </div>
        <div className="bc-build-shot">
          <Image
            src={`${asset}/build-app-basecamp.png`}
            alt={copy.screenshotAlt}
            width={3806}
            height={2168}
            sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1199px) 50vw, 632px"
          />
        </div>
      </div>
      <div id="dev-programs" className="bc-programmes">
        <div className="bc-programmes-head">
          <h2>{copy.programmesTitle}</h2>
          <p>{copy.programmesDescription}</p>
        </div>
        <div className="bc-programme-grid">
          {copy.programmes.map((item) => (
            <article key={item.eyebrow}>
              <a href={item.action.href} className="cursor-pointer">
                <Image src={item.image} alt="" width={914} height={450} />
                <div>
                  <small>{item.eyebrow}</small>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="bc-programme-action">
                    {item.action.label}
                  </span>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
