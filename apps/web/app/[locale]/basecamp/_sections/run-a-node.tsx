'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Renewal } from './atoms'
import { asset, Lines, LinkButton } from './atoms'
import { InstallLink } from './install-link'

export function RunANode({ copy }: { copy: Renewal['run'] }) {
  const [step, setStep] = useState(1)
  return (
    <section id="run-a-node" className="bc-run">
      <div className="bc-section-header">
        <h2>
          <Lines lines={copy.title} />
        </h2>
        <p>{copy.description}</p>
      </div>
      <div className="bc-run-grid">
        <div className="bc-steps">
          {copy.steps.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={`bc-step cursor-pointer ${index === step ? 'is-active' : ''}`}
              onClick={() => setStep(index)}
            >
              <span>{item.label}</span>
              <span>{item.status}</span>
              <strong>{item.title}</strong>
              <i />
            </button>
          ))}
        </div>
        <div className="bc-run-visual">
          <div className="bc-run-titlebar">
            <div>
              <i />
              <i />
              <i />
            </div>
            <span>{copy.playerHint}</span>
          </div>
          <Image
            src={`${asset}/hero-product.png`}
            alt={copy.windowAlt}
            width={1510}
            height={948}
          />
          <div className="bc-run-callout">
            <div>
              <strong>{copy.calloutTitle}</strong>
              <span>{copy.calloutBody}</span>
            </div>
            <button
              type="button"
              className="cursor-pointer"
              onClick={() => setStep((step + 1) % copy.steps.length)}
            >
              {copy.nextLabel}
            </button>
          </div>
        </div>
      </div>
      <div className="bc-run-bottom">
        <InstallLink cta={copy.install} className="bc-button-orange" />
        <LinkButton href={copy.demo.href} className="bc-button-outline">
          {copy.demo.label}
        </LinkButton>
      </div>
    </section>
  )
}
