'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { Renewal } from './atoms'
import { asset, Lines, LinkButton } from './atoms'
import { InstallLink } from './install-link'
import { NodeStepPreview } from './node-step-preview'

const stepDurationMs = 6000

export function RunANode({ copy }: { copy: Renewal['run'] }) {
  const [step, setStep] = useState(0)
  const [pinned, setPinned] = useState(false)
  const [visible, setVisible] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [stepProgress, setStepProgress] = useState(0)
  const [progress, setProgress] = useState(0)
  const stepsRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const elapsedRef = useRef(0)
  const panel = copy.panels[step]

  useEffect(() => {
    const steps = stepsRef.current
    if (!steps) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.01 }
    )
    observer.observe(steps)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const preview = previewRef.current
    if (!preview) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setPreviewVisible(entry.isIntersecting),
      { threshold: 0.01 }
    )
    observer.observe(preview)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (
      !visible ||
      pinned ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    let lastTick = performance.now()
    const interval = window.setInterval(() => {
      const now = performance.now()
      if (document.visibilityState === 'hidden') {
        lastTick = now
        return
      }

      elapsedRef.current += now - lastTick
      lastTick = now
      if (elapsedRef.current >= stepDurationMs) {
        elapsedRef.current %= stepDurationMs
        setProgress(0)
        setStep((current) => (current + 1) % copy.steps.length)
      }
      setStepProgress((elapsedRef.current / stepDurationMs) * 100)
    }, 50)
    return () => window.clearInterval(interval)
  }, [copy.steps.length, pinned, visible])

  useEffect(() => {
    if (step === 0 || !previewVisible) {
      return
    }
    const interval = window.setInterval(
      () => setProgress((current) => Math.min(current + 5, 100)),
      250
    )
    return () => window.clearInterval(interval)
  }, [step, previewVisible])

  function selectStep(index: number) {
    setStep(index)
    setProgress(0)
    setStepProgress(100)
    elapsedRef.current = 0
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
        <div className="bc-steps" ref={stepsRef}>
          {copy.steps.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={`bc-step cursor-pointer ${index === step ? 'is-active' : ''}`}
              aria-pressed={index === step}
              onClick={() => selectStep(index)}
            >
              <span>{item.label}</span>
              <span>
                {index === step
                  ? copy.activeStatus
                  : index < step
                    ? copy.completedStatus
                    : null}
              </span>
              <strong>{item.title}</strong>
              <i>
                <span
                  style={{
                    width: `${index < step ? 100 : index === step ? (pinned ? 100 : stepProgress) : 0}%`,
                  }}
                />
              </i>
            </button>
          ))}
        </div>
        <div
          ref={previewRef}
          className={`bc-run-visual ${step === 0 ? 'is-image-state' : ''}`}
        >
          <div className="bc-run-titlebar">
            <div>
              <i />
              <i />
              <i />
            </div>
            <span>
              {step > 0 || pinned
                ? copy.pinnedHint.replace('{step}', String(step + 1))
                : copy.playerHint}
            </span>
          </div>
          {step === 0 ? (
            <Image
              src={`${asset}/hero-product.png`}
              alt={copy.windowAlt}
              width={1510}
              height={948}
            />
          ) : (
            <NodeStepPreview step={step} progress={progress} copy={copy.previews} />
          )}
          {step === 0 && (
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
          )}
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
