'use client'

import { SkeletonLine } from '@/components/skeleton'
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

/**
 * A field whose value only exists once the node has settled.
 *
 * Starting a light node and finding peers takes seconds, so these would read
 * a zero and a blank and then change. A placeholder says the answer is coming
 * instead of stating a wrong one.
 */
function Field({
  label,
  value,
  isPending = false,
}: {
  label: string
  value: string
  isPending?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-label text-gray-05">{label}</dt>
      <dd className="text-mono-body break-all text-brand-dark-green">
        {isPending ? <SkeletonLine className="w-24" /> : value}
      </dd>
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
        <Field
          label="Connected peers"
          value={String(snapshot.peerCount)}
          isPending={isSettling && snapshot.peerCount === 0}
        />
        <Field
          label="This browser's peer id"
          value={
            snapshot.selfPeerId
              ? shortenPeerId(snapshot.selfPeerId)
              : 'not started'
          }
          isPending={!snapshot.selfPeerId && snapshot.status !== 'failed'}
        />
        <Field label="Network" value="Public fleet" />
      </dl>

      {snapshot.peerIds.length > 0 && (
        <details>
          <summary className="text-body-sans cursor-pointer text-gray-05 hover:text-brand-dark-green">
            Peers this browser is talking to
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {snapshot.peerIds.map((peerId) => (
              <li key={peerId} className="text-mono-body text-gray-06">
                {shortenPeerId(peerId)}
              </li>
            ))}
          </ul>
        </details>
      )}

      {snapshot.error && (
        <p
          role="alert"
          className="text-body-sans border border-accent-purple bg-brand-off-white p-3 text-accent-purple"
        >
          {snapshot.error}
        </p>
      )}
    </aside>
  )
}
