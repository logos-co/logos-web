'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { SkeletonCard, SkeletonLine, SkeletonStat } from '@/components/skeleton'
import { useChain } from '@/components/use-chain'
import { useChainStream } from '@/components/use-chain-stream'
import type { Block, NodeStatus } from '@/lib/cryptarchia'
import {
  finalityGap,
  formatAge,
  formatTimestamp,
  nodesAgree,
  readLiveness,
  shortenHash,
} from '@/lib/cryptarchia'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-label text-gray-05">{label}</dt>
      <dd className="text-h4-sans break-all text-brand-dark-green">{value}</dd>
    </div>
  )
}

/**
 * Whether the chain is producing.
 *
 * The nodes report `state: "Online"` whether or not blocks are being made, so
 * this watches the height across polls instead of trusting that field.
 */
function Liveness({
  height,
  heightChangedAt,
}: {
  height: number | null
  heightChangedAt: number | null
}) {
  // The age ticks against the clock, so it waits for mount to keep the server
  // and client markup identical.
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(timer)
  }, [])

  if (now === null || heightChangedAt === null) return null

  const liveness = readLiveness(height, now - heightChangedAt)
  if (liveness.state === 'unknown') return null

  const isAdvancing = liveness.state === 'advancing'

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <span
        aria-hidden
        className={`size-2.5 rounded-full ${
          isAdvancing ? 'animate-pulse bg-accent-steel-teal' : 'bg-accent-brown'
        }`}
      />
      <span className="text-body-sans text-brand-dark-green">
        {isAdvancing ? 'Producing blocks' : 'Height is not moving'}
      </span>
      <span className="text-body-sans text-gray-05">
        height last changed {formatAge(liveness.sinceMs)}
      </span>
    </div>
  )
}

/**
 * The page's shape while the nodes are being read.
 *
 * Deliberately the same structure as what replaces it: one summary card, four
 * stats, two node cards and a few block rows. Reading the four testnet nodes
 * and walking back through block headers takes a moment, and a page that is
 * blank for that moment looks broken.
 */
function ChainSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Reading the testnet nodes"
      className="flex flex-col gap-6"
    >
      <section className="flex flex-col gap-5 border border-gray-01 bg-white p-5">
        <SkeletonLine className="text-body-sans w-56" />

        <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {['Height', 'Slot', 'Epoch', 'Finality gap'].map((label) => (
            <SkeletonStat key={label} label={label} />
          ))}
        </dl>

        <div className="flex flex-col gap-4 border-t border-gray-01 pt-4">
          {['Chain tip', 'Last irreversible block'].map((label) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-label text-gray-05">{label}</span>
              <SkeletonLine className="text-mono-body w-full max-w-[34rem]" />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-label text-gray-05">Testnet nodes</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-label text-gray-05">Recent blocks</h2>
        <ul className="flex flex-col border border-gray-01 bg-white">
          {Array.from({ length: 4 }, (_, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-4 border-b border-gray-01 p-4 last:border-b-0"
            >
              <SkeletonLine className="text-body-sans w-16" />
              <SkeletonLine className="text-mono-body w-full max-w-72" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function NodeCard({ node }: { node: NodeStatus }) {
  return (
    <article className="flex flex-col gap-3 border border-gray-01 bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-h4-sans text-brand-dark-green">{node.label}</span>
        <span className="text-body-sans text-gray-05">
          {node.state} · {node.phase}
        </span>
      </div>
      <dl className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <dt className="text-label text-gray-05">Peer id</dt>
          <dd className="text-mono-body break-all text-gray-06">
            {shortenHash(node.peerId)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-label text-gray-05">Connected peers</dt>
          <dd className="text-mono-body text-gray-06">
            {node.connectedPeers.length}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-label text-gray-05">Tip</dt>
          <dd className="text-mono-body break-all text-gray-06">
            {shortenHash(node.tip)}
          </dd>
        </div>
      </dl>
    </article>
  )
}

/**
 * A block, expandable to its proof of leadership.
 *
 * The proof is the part that makes this chain different: proposers are picked
 * by a private lottery, so a block shows that its author won without saying
 * who they are.
 */
function BlockRow({ block, isLive }: { block: Block; isLive?: boolean }) {
  return (
    <li className="border-t border-gray-01 first:border-t-0">
      <details>
        <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3">
          <span className="text-h4-sans w-28 shrink-0 text-brand-dark-green">
            {block.slot}
          </span>
          {isLive && (
            <span className="text-body-sans text-accent-steel-teal">
              arrived live
            </span>
          )}
          <span className="text-mono-body flex-1 break-all text-gray-06">
            {shortenHash(block.id)}
          </span>
          <span className="text-body-sans text-gray-05">
            {block.transactionCount}{' '}
            {block.transactionCount === 1 ? 'tx' : 'txs'}
          </span>
          <span className="text-mono-body w-full text-gray-04 sm:w-auto">
            {block.timestamp === null
              ? 'no time yet'
              : formatTimestamp(block.timestamp)}
          </span>
        </summary>

        <dl className="flex flex-col gap-3 border-t border-gray-01 px-4 py-4">
          <div className="flex flex-col gap-1">
            <dt className="text-label text-gray-05">Block id</dt>
            <dd className="text-mono-body break-all">
              <Link
                href={`/blockchain/block/${block.id}`}
                className="cursor-pointer text-brand-dark-green underline decoration-gray-02 underline-offset-2 hover:decoration-brand-dark-green"
              >
                {block.id}
              </Link>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-label text-gray-05">Parent</dt>
            <dd className="text-mono-body break-all text-gray-06">
              {block.parent || 'none, this is the first block'}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-label text-gray-05">
              Leader key (proof of leadership)
            </dt>
            <dd className="text-mono-body break-all text-gray-06">
              {block.leaderKey || 'not reported'}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-label text-gray-05">Voucher commitment</dt>
            <dd className="text-mono-body break-all text-gray-06">
              {block.voucherCommitment || 'not reported'}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-label text-gray-05">Entropy contribution</dt>
            <dd className="text-mono-body break-all text-gray-06">
              {block.entropyContribution || 'not reported'}
            </dd>
          </div>
        </dl>
      </details>
    </li>
  )
}

export function ChainView() {
  const { view, heightChangedAt, isLoading, error } = useChain()
  const { blocks: streamed, isLive } = useChainStream(view?.time ?? null)
  const lead = view?.nodes[0] ?? null

  // Streamed blocks arrive before the next poll, so they go in front and the
  // polled list fills in behind them without repeating anything.
  const streamedIds = new Set(streamed.map((block) => block.id))
  const merged = [
    ...streamed,
    ...(view?.blocks ?? []).filter((block) => !streamedIds.has(block.id)),
  ]

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="text-body-sans text-accent-purple">
          {error}
        </p>
      )}

      {isLoading && !view && !error && <ChainSkeleton />}

      {lead && (
        <section className="flex flex-col gap-5 border border-gray-01 bg-white p-5">
          <Liveness height={lead.height} heightChangedAt={heightChangedAt} />

          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Stat label="Height" value={String(lead.height)} />
            <Stat label="Slot" value={String(lead.slot)} />
            <Stat
              label="Epoch"
              value={view?.time ? String(view.time.currentEpoch) : 'unknown'}
            />
            <Stat label="Finality gap" value={`${finalityGap(lead)} slots`} />
          </dl>

          <dl className="flex flex-col gap-4 border-t border-gray-01 pt-4">
            <div className="flex flex-col gap-1">
              <dt className="text-label text-gray-05">Chain tip</dt>
              <dd className="text-mono-body break-all text-brand-dark-green">
                {lead.tip}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-label text-gray-05">
                Last irreversible block
              </dt>
              <dd className="text-mono-body break-all text-brand-dark-green">
                {lead.lib}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {view && view.nodes.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-label text-gray-05">
              Testnet nodes ({view.nodes.length})
            </h2>
            {view.nodes.length > 1 && (
              <span className="text-body-sans text-gray-05">
                {nodesAgree(view.nodes)
                  ? 'all reporting the same tip'
                  : 'reporting different tips'}
              </span>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {view.nodes.map((node) => (
              <NodeCard key={node.label} node={node} />
            ))}
          </div>
        </section>
      )}

      {view && merged.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-label text-gray-05">
              Recent blocks ({merged.length} of {view.headerCount})
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-body-sans text-gray-05">
                {view.mempoolSize === 0
                  ? 'mempool empty'
                  : `${view.mempoolSize} in mempool`}
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={`size-2 rounded-full ${
                    isLive ? 'animate-pulse bg-accent-steel-teal' : 'bg-gray-02'
                  }`}
                />
                <span className="text-body-sans text-gray-05">
                  {isLive ? 'streaming' : 'reconnecting'}
                </span>
              </span>
            </div>
          </div>

          <ul className="flex flex-col border border-gray-01 bg-white">
            {merged.map((block) => (
              <BlockRow
                key={block.id}
                block={block}
                isLive={streamedIds.has(block.id)}
              />
            ))}
          </ul>
        </section>
      )}

      <p className="text-body-sans text-gray-05">
        Read from the Logos Blockchain testnet nodes. They allow browser calls,
        but serve plain HTTP while this page is HTTPS, so a small read-only
        endpoint in this app makes the request. Nothing is written.
      </p>
    </div>
  )
}
