import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getFresh, LEAD_NODE } from '@/lib/chain-nodes'
import type { Block } from '@/lib/cryptarchia'
import { formatTimestamp, parseBlock, parseChainTime } from '@/lib/cryptarchia'

/**
 * A block's own page.
 *
 * Rendered on the server, so the node's plain-HTTP API is reachable and the
 * page needs no client-side fetch. That also makes it shareable: the URL is
 * the block.
 */

export const dynamic = 'force-dynamic'

async function readBlock(id: string): Promise<Block | null> {
  try {
    const response = await getFresh(`${LEAD_NODE}/cryptarchia/blocks/${id}`)
    if (!response.ok) return null

    const time = parseChainTime(
      await (await getFresh(`${LEAD_NODE}/time/info`)).json().catch(() => null)
    )
    return parseBlock(await response.json(), time)
  } catch {
    return null
  }
}

function Field({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-label text-gray-05">{label}</dt>
      <dd className="text-mono-body break-all text-brand-dark-green">
        {href ? (
          <Link
            href={href}
            className="cursor-pointer underline decoration-gray-02 underline-offset-2 hover:decoration-brand-dark-green"
          >
            {value}
          </Link>
        ) : (
          value || 'not reported'
        )}
      </dd>
    </div>
  )
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const block = await readBlock(id)
  if (!block) notFound()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 md:py-16">
      <header className="flex flex-col gap-2">
        <Link
          href="/blockchain"
          className="text-label cursor-pointer text-gray-05 hover:text-brand-dark-green"
        >
          ← Logos Blockchain
        </Link>
        <p className="text-label text-gray-05">Block · slot {block.slot}</p>
        <h1 className="text-h3-sans break-all text-brand-dark-green">
          {block.id}
        </h1>
      </header>

      <section className="flex flex-col gap-5 border border-gray-01 bg-white p-5">
        <dl className="grid gap-5 sm:grid-cols-3">
          <Field label="Slot" value={String(block.slot)} />
          <Field label="Transactions" value={String(block.transactionCount)} />
          <Field
            label="Time"
            value={
              block.timestamp === null
                ? 'no time yet'
                : formatTimestamp(block.timestamp)
            }
          />
        </dl>

        <dl className="flex flex-col gap-4 border-t border-gray-01 pt-4">
          <Field
            label="Parent block"
            value={block.parent}
            href={
              block.parent ? `/blockchain/block/${block.parent}` : undefined
            }
          />
        </dl>
      </section>

      <section className="flex flex-col gap-4 border border-gray-01 bg-white p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-h4-sans text-brand-dark-green">
            Proof of leadership
          </h2>
          <p className="text-body-sans text-gray-05">
            Cryptarchia picks proposers through a private lottery, so a block
            proves its author won the right to make it without naming them.
          </p>
        </div>
        <dl className="flex flex-col gap-4">
          <Field label="Leader key" value={block.leaderKey} />
          <Field label="Voucher commitment" value={block.voucherCommitment} />
          <Field
            label="Entropy contribution"
            value={block.entropyContribution}
          />
        </dl>
      </section>
    </div>
  )
}
