'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Renewal } from './atoms'
import { Lines, LinkButton } from './atoms'

export function Build({ copy }: { copy: Renewal['build'] }) {
  const [tab, setTab] = useState(0)
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
        <div className="bc-code">
          <div className="bc-code-tabs">
            <div>
              {copy.codeTabs.map((item, index) => (
                <button
                  type="button"
                  className={`cursor-pointer ${index === tab ? 'is-active' : ''}`}
                  key={item}
                  onClick={() => setTab(index)}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="cursor-pointer"
              onClick={() =>
                void navigator.clipboard.writeText(copy.codeCommand)
              }
            >
              {copy.copyLabel}
            </button>
          </div>
          <div className="bc-code-body">
            <span>{copy.codeComment}</span>
            <p>
              <b>$</b> {copy.codeCommand}
            </p>
          </div>
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
              <Image src={item.image} alt="" width={914} height={450} />
              <div>
                <small>{item.eyebrow}</small>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <a href={item.action.href} className="cursor-pointer">
                  {item.action.label}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
