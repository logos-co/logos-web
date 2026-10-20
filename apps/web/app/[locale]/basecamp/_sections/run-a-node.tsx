'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { LogosMark } from '@acid-info/logos-ui'
import type { Renewal } from './atoms'
import { asset, Lines, LinkButton } from './atoms'
import { InstallLink } from './install-link'

export function RunANode({ copy }: { copy: Renewal['run'] }) {
  const [step, setStep] = useState(1)
  const [pinned, setPinned] = useState(false)
  const [progress, setProgress] = useState(0)
  const panel = copy.panels[step]

  useEffect(() => {
    if (
      pinned ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }
    const interval = window.setInterval(() => {
      setProgress(0)
      setStep((current) => (current + 1) % copy.steps.length)
    }, 6000)
    return () => window.clearInterval(interval)
  }, [copy.steps.length, pinned])

  useEffect(() => {
    if (step !== 0 && step !== 3) {
      return
    }
    const interval = window.setInterval(
      () => setProgress((current) => Math.min(current + 4, 100)),
      250
    )
    return () => window.clearInterval(interval)
  }, [step])

  function selectStep(index: number) {
    setStep(index)
    setProgress(0)
    setPinned(true)
  }

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
              aria-pressed={index === step}
              onClick={() => selectStep(index)}
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
            <span>
              {pinned
                ? copy.pinnedHint.replace('{step}', String(step + 1))
                : copy.playerHint}
            </span>
          </div>
          {step === 1 ? (
            <Image
              src={`${asset}/hero-product.png`}
              alt={copy.windowAlt}
              width={1510}
              height={948}
            />
          ) : (
            <div className="bc-run-panel" key={step}>
              <div className="bc-run-panel-sidebar">
                <LogosMark size={28} />
                <span>{copy.steps[step].title}</span>
              </div>
              <div className="bc-run-panel-content">
                <small>{copy.steps[step].label}</small>
                <h3>{panel.title}</h3>
                <p>{panel.body}</p>
                {(step === 0 || step === 3) && (
                  <div className="bc-run-progress" aria-label={`${progress}%`}>
                    <span style={{ width: `${progress}%` }} />
                    <b>{progress}%</b>
                  </div>
                )}
                <div className="bc-run-panel-detail">{panel.detail}</div>
              </div>
            </div>
          )}
          <div className="bc-run-callout">
            <div>
              <strong>{panel.calloutTitle}</strong>
              <span>{panel.calloutBody}</span>
            </div>
            <button
              type="button"
              className="cursor-pointer"
              onClick={() => selectStep((step + 1) % copy.steps.length)}
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
