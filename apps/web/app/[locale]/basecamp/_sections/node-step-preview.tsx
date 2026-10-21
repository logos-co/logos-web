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
    const tick = progress % 60
    const phase = tick < 15 ? 'idle' : tick < 42 ? 'installing' : 'installed'
    const installProgress = Math.min(
      100,
      Math.max(0, Math.round(((tick - 15) / 27) * 100))
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
            <span className="bc-node-package-action-wrap">
              {tick >= 8 && tick < 15 && (
                <span className="bc-node-package-tooltip">
                  {packageCopy.installTooltip.replace('{version}', packageCopy.version)}
                </span>
              )}
              <span className={`bc-node-package-action is-${phase} ${tick >= 12 && tick < 15 ? 'is-clicked' : ''}`}>
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
              <span className={`bc-node-cursor ${tick < 3 ? 'is-approaching' : ''} ${phase !== 'idle' ? 'is-leaving' : ''}`} aria-hidden="true" />
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
    const tick = progress % 46
    const started = tick >= 16
    const rippleProgress = tick >= 13 && tick < 17 ? (tick - 13) / 4 : null

    return (
      <div className="bc-node-preview bc-node-config-preview">
        <div className="bc-node-config-top">
          <h3>
            <LogosMark size={24} /> {configCopy.title}
          </h3>
          <div>
            <span className="bc-node-config-fund">{configCopy.fund}</span>
            <span className={`bc-node-config-start ${tick >= 13 && tick < 17 ? 'is-clicked' : ''}`}>
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
            <span aria-hidden="true">{started ? null : 'i'}</span>
            {started ? configCopy.startedMessage : configCopy.readyMessage}
          </div>
        </div>
        {rippleProgress !== null && (
          <span
            className="bc-node-config-ripple"
            style={{
              width: 20 + rippleProgress * 28,
              height: 20 + rippleProgress * 28,
              opacity: 1 - rippleProgress,
            }}
            aria-hidden="true"
          />
        )}
        <span className={`bc-node-cursor bc-node-config-cursor ${tick < 5 ? 'is-approaching' : ''}`} aria-hidden="true" />
      </div>
    )
  }

  const synced = Math.round((progress % 46) * 3) >= 100
  const syncProgress = Math.min(100, Math.round((progress % 46) * 3))
  return (
    <div className="bc-node-preview bc-node-sync-preview">
      <div
        className={`bc-node-sync-ring ${synced ? 'is-synced' : ''}`}
        style={{ '--bc-sync-progress': `${syncProgress}%` } as CSSProperties}
      >
        <div>
          <strong>{synced ? copy.sync.running : copy.sync.syncing}</strong>
          <span>{synced ? copy.sync.synced : `${syncProgress}%`}</span>
        </div>
      </div>
    </div>
  )
}
