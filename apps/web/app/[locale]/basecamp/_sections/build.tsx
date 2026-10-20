'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Renewal } from './atoms'
import { Lines, LinkButton } from './atoms'

export function Build({ copy }: { copy: Renewal['build'] }) {
  const [tab, setTab] = useState(0)
  const [copied, setCopied] = useState(false)
  const example = copy.codeExamples[tab]

  async function copyExample() {
    await navigator.clipboard.writeText(
      [example.comment, ...example.commands].join('\n')
    )
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

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
              {copy.codeExamples.map((item, index) => (
                <button
                  type="button"
                  className={`cursor-pointer ${index === tab ? 'is-active' : ''}`}
                  key={item.label}
                  aria-pressed={index === tab}
                  onClick={() => {
                    setTab(index)
                    setCopied(false)
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="cursor-pointer"
              onClick={() => void copyExample()}
            >
              {copied ? copy.copiedLabel : copy.copyLabel}
            </button>
          </div>
          <div className="bc-code-body">
            <span>{example.comment}</span>
            {example.commands.map((command) =>
              command.startsWith('#') ? (
                <p className="bc-code-comment" key={command}>
                  {command}
                </p>
              ) : (
                <p key={command}>
                  <b>$</b> {command}
                </p>
              )
            )}
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
