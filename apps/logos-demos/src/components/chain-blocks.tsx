'use client'

import { useEffect, useState } from 'react'

import { TransactionCard, type SelectHandler } from '@/components/chain-records'
import { useChainBlocks } from '@/components/use-chain-blocks'
import type { BlockSummary } from '@/lib/blockchain'
import {
  formatAge,
  formatTimestamp,
  readLiveness,
  shortenHash,
} from '@/lib/blockchain'

/**
 * Whether the chain is still producing.
 *
 * The testnet sits idle for days at a time, and a list of blocks gives no hint
 * of that on its own: the numbers look the same whether the newest one arrived
 * a minute or a week ago.
 */
function Liveness({ blocks }: { blocks: BlockSummary[] }) {
  // Measured against the clock, so it waits for mount to keep the server and
  // client markup identical.
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 10000)
    return () => clearInterval(timer)
  }, [])

  if (now === null) return null
  const liveness = readLiveness(blocks, now)
  if (liveness.state === 'unknown') return null

  const isLive = liveness.state === 'live'

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <span
        aria-hidden
        className={`size-2.5 rounded-full ${
          isLive ? 'animate-pulse bg-accent-steel-teal' : 'bg-accent-brown'
        }`}
      />
      <span className="text-body-sans text-brand-dark-green">
        {isLive ? 'Producing blocks' : 'No new blocks'}
      </span>
      <span className="text-caption-sans text-gray-05">
        last block {formatAge(liveness.ageMs)}
      </span>
    </div>
  )
}

/** A block, expandable to the transactions that arrived with it. */
function BlockRow({
  block,
  onSelect,
}: {
  block: BlockSummary
  onSelect?: SelectHandler
}) {
  const label = `${block.transactionCount} ${block.transactionCount === 1 ? 'tx' : 'txs'}`

  return (
    <li className="border-t border-gray-01 py-3 first:border-t-0 first:pt-0">
      <details>
        <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-h4-sans w-24 shrink-0 text-brand-dark-green">
            {block.id}
          </span>
          <span className="text-mono-s flex-1 break-all text-gray-06">
            {shortenHash(block.hash)}
          </span>
          <span className="text-caption-sans text-gray-05">{label}</span>
          <span className="text-caption-sans w-20 shrink-0 text-gray-05">
            {block.status}
          </span>
          <span className="text-mono-s w-full text-gray-04 sm:w-auto">
            {formatTimestamp(block.timestamp)}
          </span>
        </summary>

        <div className="mt-3 flex flex-col gap-3">
          {block.transactions.length === 0 ? (
            <p className="text-caption-sans text-gray-04">
              This block carried no transactions.
            </p>
          ) : (
            block.transactions.map((tx) => (
              <TransactionCard key={tx.hash} tx={tx} onSelect={onSelect} />
            ))
          )}
        </div>
      </details>
    </li>
  )
}

export function ChainBlocks({ onSelect }: { onSelect?: SelectHandler }) {
  const { blocks, isLoading, error } = useChainBlocks()

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-eyebrow text-gray-05">Recent blocks</h2>

      <div className="flex flex-col gap-4 border border-gray-01 bg-white p-5">
        <Liveness blocks={blocks} />

        {error && (
          <p role="alert" className="text-caption-sans text-accent-purple">
            {error}
          </p>
        )}

        {isLoading && blocks.length === 0 && !error && (
          <p className="text-body-sans text-gray-04">Loading recent blocks…</p>
        )}

        {blocks.length > 0 && (
          <ul className="flex flex-col">
            {blocks.map((block) => (
              <BlockRow key={block.hash} block={block} onSelect={onSelect} />
            ))}
          </ul>
        )}
      </div>

      <p className="text-caption-sans text-gray-05">
        This demo reads the public LEZ block explorer through a proxy in this
        app, because the explorer does not allow browsers on other sites to call
        it directly. Nothing is written, and no key or account of yours is
        involved.
      </p>
    </section>
  )
}
