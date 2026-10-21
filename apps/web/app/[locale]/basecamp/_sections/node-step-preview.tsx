import type { CSSProperties } from 'react'
import { LogosMark } from '@acid-info/logos-ui'
import type { Renewal } from './atoms'

interface NodeStepPreviewProps {
  step: number
  progress: number
  copy: Renewal['run']['previews']
}

export function NodeStepPreview({
  step,
  progress,
  copy,
}: NodeStepPreviewProps) {
  if (step === 1) {
    const packageCopy = copy.package
    const phase =
      progress < 20 ? 'idle' : progress < 90 ? 'installing' : 'installed'
    const installProgress = Math.min(
      100,
      Math.max(0, Math.round(((progress - 20) / 70) * 100))
    )

    return (
      <div className="bc-node-preview bc-node-package-preview">
        <div className="bc-node-package-table">
          <div className="bc-node-package-tabs">
            <strong>{packageCopy.title}</strong>
            {packageCopy.tabs.map((tab, index) => (
              <span className={index === 0 ? 'is-active' : ''} key={tab}>
                {tab}
              </span>
            ))}
          </div>
          <div className="bc-node-package-row bc-node-package-head">
            {packageCopy.columns.map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>
          <div className="bc-node-package-repository">
            {packageCopy.repository}
          </div>
          <div className="bc-node-package-row bc-node-package-entry">
            <strong>{packageCopy.name}</strong>
            <span>{packageCopy.type}</span>
            <span>
              {phase === 'installed'
                ? packageCopy.version
                : packageCopy.notInstalled}
            </span>
            <span className="bc-node-package-version">
              {packageCopy.version}
            </span>
            <span>{packageCopy.size}</span>
            <span className={`bc-node-package-action is-${phase}`}>
              {phase === 'idle'
                ? packageCopy.install
                : phase === 'installing'
                  ? packageCopy.installing
                  : packageCopy.installed}
              {phase === 'installing' && (
                <i>
                  <span style={{ width: `${installProgress}%` }} />
                </i>
              )}
            </span>
          </div>
        </div>
        <p>
          {phase === 'idle'
            ? packageCopy.idleCaption
            : phase === 'installing'
              ? packageCopy.installingCaption.replace(
                  '{progress}',
                  String(installProgress)
                )
              : packageCopy.installedCaption}
        </p>
      </div>
    )
  }

  if (step === 2) {
    const configCopy = copy.config
    const started = progress >= 55

    return (
      <div className="bc-node-preview bc-node-config-preview">
        <div className="bc-node-config-top">
          <h3>
            <LogosMark size={24} /> {configCopy.title}
          </h3>
          <div>
            <span className="bc-node-config-fund">{configCopy.fund}</span>
            <span className="bc-node-config-start">
              {started ? configCopy.stopNode : configCopy.startNode}
            </span>
          </div>
        </div>
        <div className="bc-node-config-tabs">
          {configCopy.tabs.map((tab, index) => (
            <span
              className={
                index === configCopy.tabs.length - 1 ? 'is-active' : ''
              }
              key={tab}
            >
              {tab}
            </span>
          ))}
        </div>
        <div className="bc-node-config-card">
          <h4>{configCopy.sectionTitle}</h4>
          <strong>{configCopy.userConfig}</strong>
          <div className="bc-node-config-field">
            <span>{configCopy.path}</span>
            <span>{configCopy.browse}</span>
          </div>
          <small>{configCopy.generated}</small>
          <strong>{configCopy.deploymentConfig}</strong>
          <div className="bc-node-config-field">
            <span>{configCopy.builtIn}</span>
            <span>{configCopy.browse}</span>
          </div>
          <small>{configCopy.deploymentDetail}</small>
          <div
            className={`bc-node-config-banner ${started ? 'is-started' : ''}`}
            aria-live="polite"
          >
            <span aria-hidden="true" />
            {started ? configCopy.startedMessage : configCopy.readyMessage}
          </div>
        </div>
      </div>
    )
  }

  const synced = progress >= 100
  return (
    <div className="bc-node-preview bc-node-sync-preview">
      <div
        className={`bc-node-sync-ring ${synced ? 'is-synced' : ''}`}
        style={{ '--bc-sync-progress': `${progress}%` } as CSSProperties}
      >
        <div>
          <strong>{synced ? copy.sync.running : copy.sync.syncing}</strong>
          <span>{synced ? copy.sync.synced : `${progress}%`}</span>
        </div>
      </div>
    </div>
  )
}
