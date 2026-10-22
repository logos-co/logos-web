'use client'

import { useState } from 'react'
import { BasecampCheckIcon, LogosMark } from '@acid-info/logos-ui'

import type { Renewal } from './atoms'
import { useNodeBoot } from './use-node-boot'

interface BlockchainDemoProps {
  copy: Renewal['hero']['blockchainDemo']
  title: string
  category: string
}

export function BlockchainDemo({ copy, title, category }: BlockchainDemoProps) {
  const [tab, setTab] = useState(0)
  const [nodeRunning, setNodeRunning] = useState(true)
  const [mining, setMining] = useState(true)
  const boot = useNodeBoot(nodeRunning)
  const isOnline = nodeRunning && boot.isOnline
  const doneStages = nodeRunning ? boot.doneStages : 0
  const statusLabel = !nodeRunning
    ? copy.offline
    : !boot.isStarted
      ? copy.notStarted
      : isOnline
        ? copy.online
        : copy.starting
  const statusClass =
    !nodeRunning || !boot.isStarted
      ? 'is-offline'
      : isOnline
        ? ''
        : 'is-starting'

  return (
    <div className="bc-demo-blockchain">
      <div className="bc-demo-chip">
        <i />
        {category}
      </div>
      <div className="bc-demo-blockchain-heading">
        <h2>
          <LogosMark size={21} />
          {title}
        </h2>
        <div className="bc-demo-blockchain-controls">
          <button
            type="button"
            className="cursor-pointer"
            disabled={!isOnline}
            onClick={() => setMining((value) => !value)}
          >
            {mining ? copy.stopMining : copy.startMining}
          </button>
          <button
            type="button"
            className="cursor-pointer is-primary"
            onClick={() => {
              setNodeRunning((value) => !value)
              if (nodeRunning) setMining(false)
            }}
          >
            {nodeRunning ? copy.stopNode : copy.startNode}
          </button>
        </div>
      </div>
      <div
        className="bc-demo-blockchain-tabs"
        role="tablist"
        aria-label={title}
      >
        {copy.tabs.map((label, index) => (
          <button
            type="button"
            role="tab"
            aria-selected={tab === index}
            className={`cursor-pointer ${tab === index ? 'is-active' : ''}`}
            key={label}
            onClick={() => setTab(index)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 0 ? (
        <div className="bc-demo-node-panel" role="tabpanel">
          <div className="bc-demo-node-status">
            <div className="bc-demo-node-status-head">
              <strong className={statusClass}>{statusLabel}</strong>
              <span>
                {isOnline ? (
                  <>
                    {copy.uptime}
                    <br />
                    {copy.following}
                  </>
                ) : null}
              </span>
            </div>
            <div className="bc-demo-node-stages">
              {copy.stages.map((stage, index) => (
                <span
                  key={stage}
                  className={
                    index < doneStages
                      ? 'is-done'
                      : index === doneStages && boot.isStarted && nodeRunning
                        ? 'is-current'
                        : ''
                  }
                >
                  {index < doneStages ? <BasecampCheckIcon /> : null}
                  {stage}
                </span>
              ))}
            </div>
          </div>
          <div className="bc-demo-node-metrics">
            {copy.metrics.map((metric) => {
              const isPeerId = metric.label === copy.peerLabel
              return (
                <div key={metric.label}>
                  <small>{metric.label}</small>
                  <strong
                    className={
                      isOnline && metric.label === copy.metrics[2].label
                        ? 'is-blue'
                        : ''
                    }
                  >
                    {isOnline || (nodeRunning && isPeerId)
                      ? metric.value
                      : copy.emptyValue}
                  </strong>
                  {metric.detail && (
                    <span>{isOnline ? metric.detail : ''}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bc-demo-blockchain-detail" role="tabpanel">
          <h3>{copy.panels[tab].title}</h3>
          <p>{copy.panels[tab].description}</p>
        </div>
      )}
    </div>
  )
}

interface StorageDemoProps {
  copy: Renewal['hero']['storageDemo']
  nodeCopy: Renewal['hero']['storageNode']
  title: string
  category: string
  blockchainCategory: string
}

export function StorageDemo({
  copy,
  nodeCopy,
  title,
  category,
  blockchainCategory,
}: StorageDemoProps) {
  const [nodeRunning, setNodeRunning] = useState(true)

  return (
    <div className="bc-demo-storage">
      <div className="bc-demo-storage-tabs">
        <span>
          <i />
          {blockchainCategory}
        </span>
        <span className="is-active">
          <i />
          {category}
        </span>
      </div>
      <div className="bc-demo-storage-grid">
        <div className="bc-demo-storage-vault">
          <div className="bc-demo-storage-vault-head">
            <div>
              <small>{copy.brandLabel}</small>
              <strong>
                {copy.vaultTitle} <em>{copy.alpha}</em>
              </strong>
            </div>
            <div>
              <b>
                {copy.used} <span>/ {copy.capacity}</span>
              </b>
              <small>{copy.spaceLabel}</small>
            </div>
          </div>
          <div className="bc-demo-storage-usage">
            <span />
          </div>
          <div className="bc-demo-storage-key">
            <span>{copy.utilised}</span>
            <span>{copy.free}</span>
          </div>
          <div className="bc-demo-storage-rate">
            {copy.utilisationRate}
            <i />
          </div>
          <h2>{title}</h2>
        </div>
        <div className="bc-demo-storage-middle">
          <div className="bc-demo-storage-download">
            <i />
            {copy.noDownload}
          </div>
          <div className="bc-demo-storage-upload">
            <div className="bc-demo-storage-dropzone">
              <strong>{copy.browseLabel}</strong>
              <span>{copy.uploadLimit}</span>
            </div>
            <h3>{copy.uploadTitle}</h3>
          </div>
          <div className="bc-demo-storage-fetch">
            <div className="bc-demo-storage-fetch-row">
              <span className="bc-demo-storage-cid">{copy.cidPlaceholder}</span>
              <span className="bc-demo-storage-fetch-button">
                {copy.fetchLabel}
              </span>
            </div>
            <div className="bc-demo-storage-fetch-meta">
              <h3>{copy.fetchTitle}</h3>
              <span className="bc-demo-storage-private">
                <i />
                {copy.privateLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="bc-demo-storage-right">
          <div className="bc-demo-storage-node">
            <h3>
              {copy.nodeLabel}
              <i className={nodeRunning ? '' : 'is-offline'} />
            </h3>
            <span>{nodeCopy.label}</span>
            <div>
              <span>
                <i />
                {nodeRunning ? copy.nodeStatus : nodeCopy.stoppedStatus}
              </span>
              <button
                type="button"
                className="cursor-pointer"
                onClick={() => setNodeRunning((value) => !value)}
              >
                {nodeRunning ? nodeCopy.stopLabel : nodeCopy.startLabel}
              </button>
            </div>
          </div>
          <div className="bc-demo-storage-peers">
            <div className="bc-demo-peer-gauge">
              <span>{nodeRunning ? copy.peers : copy.emptyPeerCount}</span>
            </div>
            <small>{copy.peerLabel}</small>
            <p>{nodeRunning ? copy.discovering : nodeCopy.stoppedStatus}</p>
            <h3>{copy.peerLabel}</h3>
          </div>
        </div>
      </div>
      <div className="bc-demo-storage-manifests">
        <h2>{copy.manifestsTitle}</h2>
        <div className="bc-demo-manifest-head">
          {copy.manifestHeaders.map((header) => (
            <span key={header}>{header}</span>
          ))}
        </div>
        {copy.manifests.map((manifest) => (
          <div className="bc-demo-manifest-row" key={manifest.cid}>
            <span>
              <i />
              <b>{manifest.name}</b>
              <small>{manifest.cid}</small>
            </span>
            <span>{copy.manifestMimeType}</span>
            <span>{manifest.size}</span>
            <span className="bc-demo-manifest-actions">
              <i />
              <i />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
