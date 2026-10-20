'use client'

import { useState } from 'react'
import Image from 'next/image'
import { LogosMark } from '@acid-info/logos-ui'
import type { Renewal } from './atoms'
import { asset, Lines, LinkButton } from './atoms'
import { HeroChatDemo } from './hero-chat-demo'
import { InstallLink } from './install-link'

export function Hero({ copy }: { copy: Renewal['hero'] }) {
  const [preview, setPreview] = useState(0)
  const [storageNodeRunning, setStorageNodeRunning] = useState(true)

  return (
    <section className="bc-hero">
      <div className="bc-hero-inner">
        <div className="bc-hero-copy">
          <div className="bc-badges">
            {copy.badges.map((label) => (
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
          >
            <div className="bc-product-titlebar">
              <div>
                <i />
                <i />
                <i />
              </div>
              <span>{copy.windowTitle}</span>
              <div
                className="bc-product-tabs"
                role="tablist"
                aria-label={copy.previewLabel}
              >
                {copy.previewTabs.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={index === preview}
                    className={`cursor-pointer ${index === preview ? 'is-active' : ''}`}
                    onClick={() => setPreview(index)}
                  >
                    {label}
                  </button>
                ))}
              </div>
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
                <aside>
                  <LogosMark size={30} />
                  {copy.previewTabs.slice(1).map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      className={`cursor-pointer ${index + 1 === preview ? 'is-active' : ''}`}
                      onClick={() => setPreview(index + 1)}
                    >
                      {label}
                    </button>
                  ))}
                </aside>
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
