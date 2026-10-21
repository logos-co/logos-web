'use client'

import { useRef, useState } from 'react'
import {
  BasecampAppMark,
  BasecampBlockchainIcon,
  BasecampChatIcon,
  BasecampStorageIcon,
} from '@acid-info/logos-ui'

import type { Renewal } from './atoms'
import { BlockchainDemo, StorageDemo } from './hero-app-demos'
import { HeroChatDemo } from './hero-chat-demo'
import './hero-app-window.css'
import './hero-blockchain-demo.css'
import './hero-chat-demo.css'
import './hero-storage-demo.css'
import './hero-app-window-responsive.css'

interface HeroAppWindowProps {
  copy: Renewal['hero']
  releaseTag: string
  testnetBadge: string
}

const icons = [
  BasecampBlockchainIcon,
  BasecampChatIcon,
  BasecampStorageIcon,
] as const

export function HeroAppWindow({
  copy,
  releaseTag,
  testnetBadge,
}: HeroAppWindowProps) {
  const [selected, setSelected] = useState(0)
  const touchStartX = useRef<number | null>(null)

  return (
    <div
      className="bc-demo-window"
      aria-label={copy.windowAlt}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(event) => {
        if (touchStartX.current === null) return
        const distance = event.changedTouches[0]?.clientX - touchStartX.current
        touchStartX.current = null
        if (distance !== undefined && Math.abs(distance) > 45) {
          setSelected((current) => (current + (distance < 0 ? 1 : 2)) % 3)
        }
      }}
    >
      <div className="bc-demo-inner">
        <div className="bc-demo-titlebar">
          <span className="bc-demo-window-dots">
            <i />
            <i />
            <i />
          </span>
          <span>{copy.windowTitle}</span>
        </div>
        <div className="bc-demo-body">
          <aside className="bc-demo-sidebar">
            <div className="bc-demo-brand">
              <BasecampAppMark />
            </div>
            <div
              className="bc-demo-apps"
              role="tablist"
              aria-label={copy.previewLabel}
            >
              {copy.previewTabs.map((label, index) => {
                const Icon = icons[index]
                return (
                  <button
                    type="button"
                    role="tab"
                    aria-label={label}
                    aria-selected={selected === index}
                    className={`bc-demo-app cursor-pointer ${selected === index ? 'is-active' : ''}`}
                    key={label}
                    onClick={() => setSelected(index)}
                  >
                    <span
                      className={`bc-demo-app-icon bc-demo-app-icon-${index}`}
                    >
                      <Icon />
                    </span>
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
            <span className="bc-demo-version">
              {releaseTag.replace(/^v/i, '')} · {copy.portableLabel}
            </span>
          </aside>
          <div className="bc-demo-screen" role="tabpanel">
            {/* Package Manager is retained for a later preview. The first visible screen is Blockchain.
            <Image src="/images/basecamp/renewal/hero-product.png" alt={copy.windowAlt} width={1510} height={948} />
            */}
            {selected === 0 ? (
              <BlockchainDemo
                copy={copy.blockchainDemo}
                title={copy.previews[0].title}
                category={copy.previewTabs[0]}
              />
            ) : selected === 1 ? (
              <HeroChatDemo
                copy={copy.chatDemo}
                description={copy.previews[1].description}
                details={copy.previews[1].details}
              />
            ) : (
              <StorageDemo
                copy={copy.storageDemo}
                nodeCopy={copy.storageNode}
                title={copy.previewTabs[2]}
                category={copy.previewTabs[2]}
                blockchainCategory={copy.previewTabs[0]}
              />
            )}
          </div>
        </div>
        <div className="bc-demo-footer">
          <span>
            <i />
            {copy.status}
          </span>
          <span>{testnetBadge.toLowerCase()}</span>
        </div>
      </div>
      <div
        className="bc-demo-mobile-tabs"
        role="tablist"
        aria-label={copy.previewLabel}
      >
        {copy.previewTabs.map((label, index) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-label={label}
            aria-selected={selected === index}
            className={`cursor-pointer ${selected === index ? 'is-active' : ''}`}
            onClick={() => setSelected(index)}
          />
        ))}
      </div>
    </div>
  )
}
