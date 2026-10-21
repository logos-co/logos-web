'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { LogosMark, PointerIcon } from '@acid-info/logos-ui'
import type { Renewal } from './atoms'
import { asset, Lines, LinkButton } from './atoms'
import { HeroChatDemo } from './hero-chat-demo'
import { InstallLink } from './install-link'

export function Hero({
  copy,
  badges,
}: {
  copy: Renewal['hero']
  badges: readonly string[]
}) {
  const [preview, setPreview] = useState(0)
  const [storageNodeRunning, setStorageNodeRunning] = useState(true)
  const [hasInteracted, setHasInteracted] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const selectPreview = (index: number) => {
    setPreview(index)
    setHasInteracted(true)
  }

  return (
    <section className="bc-hero">
      <div className="bc-hero-inner">
        <div className="bc-hero-copy">
          <div className="bc-badges">
            {badges.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <h1>
            <Lines lines={copy.title} />
          </h1>
          <p className="bc-hero-description">{copy.description}</p>
          <p className="bc-hero-statement">{copy.statement}</p>
          <div className="bc-actions">
            <InstallLink cta={copy.install} className="bc-button-orange" />
            <LinkButton href={copy.versions.href} className="bc-button-outline">
              {copy.versions.label}
            </LinkButton>
          </div>
          <div className="bc-platforms">
            {copy.platforms.map((platform) => (
              <span key={platform.label}>
                <i className={platform.available ? 'bc-available' : ''} />
                {platform.label}
              </span>
            ))}
          </div>
        </div>
        <div className="bc-hero-visual">
          <Image
            src={`${asset}/hero-glow.svg`}
            alt=""
            width={1100}
            height={820}
            className="bc-hero-glow"
          />
          <div
            className={`bc-product-window ${preview === 0 ? '' : 'has-preview'}`}
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null
            }}
            onTouchEnd={(event) => {
              if (touchStartX.current === null) return
              const distance = event.changedTouches[0]?.clientX - touchStartX.current
              touchStartX.current = null
              if (distance !== undefined && Math.abs(distance) > 45) {
                selectPreview((preview + (distance < 0 ? 1 : 3)) % 4)
              }
            }}
          >
            <div className="bc-product-titlebar">
              <div>
                <i />
                <i />
                <i />
              </div>
              <span>{copy.windowTitle}</span>
            </div>
            {preview === 0 ? (
              <Image
                src={`${asset}/hero-product.png`}
                alt={copy.windowAlt}
                width={1510}
                height={948}
                priority
                className="bc-hero-product"
              />
            ) : (
              <div className="bc-product-preview" role="tabpanel">
                <div className={preview === 2 ? 'bc-product-chat-content' : ''}>
                  {preview === 2 ? (
                    <HeroChatDemo
                      copy={copy.chatDemo}
                      description={copy.previews[1].description}
                      details={copy.previews[1].details}
                    />
                  ) : (
                    <>
                      <small>{copy.windowTitle}</small>
                      <h2>{copy.previews[preview - 1].title}</h2>
                      <p>{copy.previews[preview - 1].description}</p>
                      <div className="bc-product-preview-grid">
                        {copy.previews[preview - 1].details.map((detail) => (
                          <span key={detail}>{detail}</span>
                        ))}
                      </div>
                      {preview === 3 && (
                        <div className="bc-storage-node">
                          <span>{copy.storageNode.label}</span>
                          <span>
                            {storageNodeRunning
                              ? copy.storageNode.activeStatus
                              : copy.storageNode.stoppedStatus}
                          </span>
                          <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() =>
                              setStorageNodeRunning((running) => !running)
                            }
                          >
                            {storageNodeRunning
                              ? copy.storageNode.stopLabel
                              : copy.storageNode.startLabel}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="bc-product-app-rail" role="tablist" aria-label={copy.previewLabel}>
              {copy.previewTabs.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-label={label}
                  aria-selected={index === preview}
                  className={`cursor-pointer ${index === preview ? 'is-active' : ''}`}
                  onClick={() => selectPreview(index)}
                >
                  {index === 0 ? (
                    <LogosMark size={24} />
                  ) : (
                    <Image
                      src={`${asset}/app-icons/${['', 'blockchain', 'chat', 'storage'][index]}.png`}
                      alt=""
                      width={24}
                      height={24}
                    />
                  )}
                </button>
              ))}
            </div>
            {preview === 0 && !hasInteracted && (
              <div className="bc-product-hint">
                <PointerIcon width={14} height={14} />
                {copy.interactionHint}
              </div>
            )}
          </div>
          <div className="bc-product-dots" aria-label={copy.previewLabel}>
            {copy.previewTabs.map((label, index) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                aria-current={index === preview ? 'true' : undefined}
                className="cursor-pointer"
                onClick={() => selectPreview(index)}
              />
            ))}
          </div>
          <div className="bc-status">
            <span className="bc-status-dot" />
            {copy.status}
          </div>
        </div>
      </div>
    </section>
  )
}
