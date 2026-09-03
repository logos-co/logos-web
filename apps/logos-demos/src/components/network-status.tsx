'use client'

import { type NodeSnapshot, shortenPeerId } from '@/lib/waku'

const STATUS_COPY: Record<NodeSnapshot['status'], string> = {
  idle: 'Idle',
  starting: 'Starting node',
  connecting: 'Finding peers',
  ready: 'Connected',
  failed: 'Failed',
}

const STATUS_TONE: Record<NodeSnapshot['status'], string> = {
  idle: 'bg-gray-02',
  starting: 'bg-accent-tan',
  connecting: 'bg-brand-yellow',
  ready: 'bg-accent-steel-teal',
  failed: 'bg-accent-purple',
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-eyebrow text-gray-05">{label}</dt>
      <dd className="text-mono-s break-all text-brand-dark-green">{value}</dd>
    </div>
  )
}

export function NetworkStatus({ snapshot }: { snapshot: NodeSnapshot }) {
  const isSettling =
    snapshot.status === 'starting' || snapshot.status === 'connecting'

  return (
    <aside className="flex flex-col gap-5 border border-gray-01 bg-white p-5">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className={`size-2.5 rounded-full ${STATUS_TONE[snapshot.status]} ${
            isSettling ? 'animate-pulse' : ''
          }`}
        />
        <span className="text-body-sans text-brand-dark-green">
          {STATUS_COPY[snapshot.status]}
        </span>
      </div>

      <dl className="flex flex-col gap-4">
        <Field label="Connected peers" value={String(snapshot.peerCount)} />
        <Field
          label="This browser's peer id"
          value={snapshot.selfPeerId ? shortenPeerId(snapshot.selfPeerId) : '—'}
        />
        <Field label="Network" value="Waku · public fleet" />
      </dl>

      {snapshot.peerIds.length > 0 && (
        <details>
          <summary className="text-caption-sans cursor-pointer text-gray-05 hover:text-brand-dark-green">
            Peers this browser is talking to
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {snapshot.peerIds.map((peerId) => (
              <li key={peerId} className="text-mono-s text-gray-06">
                {shortenPeerId(peerId)}
              </li>
            ))}
          </ul>
        </details>
      )}

      {snapshot.error && (
        <p
          role="alert"
          className="text-caption-sans border border-accent-purple bg-brand-off-white p-3 text-accent-purple"
        >
          {snapshot.error}
        </p>
      )}
    </aside>
  )
}
