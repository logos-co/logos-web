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
  idle: 'bg-[var(--color-gray-02)]',
  starting: 'bg-[var(--color-accent-tan)]',
  connecting: 'bg-[var(--color-brand-yellow)]',
  ready: 'bg-[var(--color-accent-steel-teal)]',
  failed: 'bg-[var(--color-accent-purple)]',
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[11px] uppercase tracking-wider text-[var(--color-gray-05)]">
        {label}
      </dt>
      <dd className="font-[family-name:var(--font-mono)] text-[13px] break-all text-[var(--color-brand-dark-green)]">
        {value}
      </dd>
    </div>
  )
}

export function NetworkStatus({ snapshot }: { snapshot: NodeSnapshot }) {
  const isSettling =
    snapshot.status === 'starting' || snapshot.status === 'connecting'

  return (
    <aside className="flex flex-col gap-5 rounded-lg border border-[var(--color-gray-01)] bg-[var(--color-white)] p-5">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className={`size-2.5 rounded-full ${STATUS_TONE[snapshot.status]} ${
            isSettling ? 'animate-pulse' : ''
          }`}
        />
        <span className="text-sm font-medium">
          {STATUS_COPY[snapshot.status]}
        </span>
      </div>

      <dl className="flex flex-col gap-4">
        <Field label="Connected peers" value={String(snapshot.peerCount)} />
        <Field
          label="This browser's peer id"
          value={
            snapshot.selfPeerId ? shortenPeerId(snapshot.selfPeerId) : '—'
          }
        />
        <Field label="Network" value="Waku · public fleet" />
      </dl>

      {snapshot.peerIds.length > 0 && (
        <details className="text-[13px]">
          <summary className="cursor-pointer text-[var(--color-gray-05)] hover:text-[var(--color-brand-dark-green)]">
            Peers this browser is talking to
          </summary>
          <ul className="mt-2 flex flex-col gap-1 font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-gray-06)]">
            {snapshot.peerIds.map((peerId) => (
              <li key={peerId}>{shortenPeerId(peerId)}</li>
            ))}
          </ul>
        </details>
      )}

      {snapshot.error && (
        <p
          role="alert"
          className="rounded border border-[var(--color-accent-purple)] bg-[var(--color-brand-off-white)] p-3 text-[13px] text-[var(--color-accent-purple)]"
        >
          {snapshot.error}
        </p>
      )}
    </aside>
  )
}
