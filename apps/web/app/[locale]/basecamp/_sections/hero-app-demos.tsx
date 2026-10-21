'use client'

import { useRef, useState } from 'react'
import { LogosMark } from '@acid-info/logos-ui'
import type { Renewal } from './atoms'

interface BlockchainDemoProps {
  copy: Renewal['hero']['blockchainDemo']
  title: string
}

export function BlockchainDemo({ copy, title }: BlockchainDemoProps) {
  const [tab, setTab] = useState(0)
  const [nodeRunning, setNodeRunning] = useState(true)
  const [mining, setMining] = useState(true)

  return (
    <div className="bc-app-demo bc-blockchain-demo">
      <header className="bc-app-demo-header">
        <div>
          <LogosMark size={14} />
          <h2>{title}</h2>
        </div>
        <span className="bc-app-demo-status">
          <i className={nodeRunning ? '' : 'is-offline'} />
          {nodeRunning ? copy.online : copy.offline}
        </span>
      </header>
      <div className="bc-app-demo-tabs" role="tablist" aria-label={title}>
        {copy.tabs.map((label, index) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={tab === index}
            className={`cursor-pointer ${tab === index ? 'is-active' : ''}`}
            onClick={() => setTab(index)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="bc-blockchain-content" role="tabpanel">
        <div className="bc-blockchain-heading">
          <div>
            <h3>{copy.panels[tab].title}</h3>
            <p>{copy.panels[tab].description}</p>
          </div>
          <div className="bc-blockchain-controls">
            <button
              type="button"
              className="cursor-pointer"
              onClick={() => {
                setNodeRunning((running) => !running)
                if (nodeRunning) setMining(false)
              }}
            >
              {nodeRunning ? copy.stopNode : copy.startNode}
            </button>
            <button
              type="button"
              className="cursor-pointer"
              disabled={!nodeRunning}
              onClick={() => setMining((running) => !running)}
            >
              {mining ? copy.stopMining : copy.startMining}
            </button>
          </div>
        </div>
        <div className="bc-blockchain-metrics">
          {copy.metrics.map((metric) => (
            <div key={metric.label}>
              <small>{metric.label}</small>
              <strong>{nodeRunning ? metric.value : copy.emptyValue}</strong>
            </div>
          ))}
        </div>
        <div className="bc-blockchain-lower">
          <div>
            <small>{copy.nodeLabel}</small>
            <strong>{nodeRunning ? copy.online : copy.offline}</strong>
            <span>{copy.peerLabel}: {nodeRunning ? copy.peerId : copy.emptyValue}</span>
          </div>
          <div>
            <small>{copy.systemLabel}</small>
            <div className="bc-blockchain-system">
              {copy.system.map((label) => <span key={label}>{label}<b>{copy.emptyValue}</b></span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StorageDemoProps {
  copy: Renewal['hero']['storageDemo']
  title: string
}

export function StorageDemo({ copy, title }: StorageDemoProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState('')
  const [cid, setCid] = useState('')
  const [fetchMessage, setFetchMessage] = useState('')

  return (
    <div className="bc-app-demo bc-storage-demo">
      <header className="bc-app-demo-header">
        <div>
          <small>{copy.alpha}</small>
          <h2>{title}</h2>
        </div>
        <span className="bc-app-demo-status"><i />{copy.nodeStatus}</span>
      </header>
      <div className="bc-storage-content">
        <div className="bc-storage-usage">
          <div><small>{copy.usageLabel}</small><strong>{copy.used} <em>/ {copy.capacity}</em></strong></div>
          <div className="bc-storage-progress"><span /></div>
        </div>
        <div className="bc-storage-panels">
          <section className="bc-storage-upload">
            <h3>{copy.uploadTitle}</h3>
            <button
              type="button"
              className="bc-storage-drop cursor-pointer"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                setSelectedFile(event.dataTransfer.files[0]?.name ?? '')
              }}
            >
              <strong>{copy.browseLabel}</strong>
              <small>{selectedFile ? `${copy.selectedLabel} ${selectedFile}` : copy.uploadHint}</small>
            </button>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
              onChange={(event) => setSelectedFile(event.target.files?.[0]?.name ?? '')}
            />
          </section>
          <section className="bc-storage-fetch">
            <h3>{copy.fetchTitle}</h3>
            <form onSubmit={(event) => { event.preventDefault(); setFetchMessage(cid ? copy.fetchPreviewNotice : copy.invalidCid) }}>
              <input
                value={cid}
                onChange={(event) => setCid(event.target.value)}
                placeholder={copy.cidPlaceholder}
                aria-label={copy.cidPlaceholder}
              />
              <button type="submit" className="cursor-pointer">{copy.fetchLabel}</button>
            </form>
            {fetchMessage && <small role="status">{fetchMessage}</small>}
            <div className="bc-storage-node-status">
              <span>{copy.nodeLabel}<b>{copy.nodeStatus}</b></span>
              <span>{copy.peerLabel}<b>{copy.peers}</b></span>
            </div>
          </section>
        </div>
        <section className="bc-storage-manifests">
          <h3>{copy.manifestsTitle}</h3>
          <table>
            <thead><tr>{copy.manifestHeaders.map((header) => <th key={header}>{header}</th>)}</tr></thead>
            <tbody>{copy.manifests.map((manifest) => <tr key={manifest.cid}><td>{manifest.name}</td><td>{manifest.cid}</td><td>{manifest.size}</td></tr>)}</tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
