'use client'

import type { ReactNode } from 'react'

import type {
  AccountSummary,
  BlockSummary,
  TransactionSummary,
} from '@/lib/blockchain'
import { formatTimestamp, shortenHash } from '@/lib/blockchain'

/** Follow a hash or address the explorer can look up. */
export type SelectHandler = (query: string) => void

/**
 * An identifier that can be followed. Every hash and address on this page is
 * something the explorer can resolve, so they are all links rather than text to
 * be copied into the search box by hand.
 */
function Id({
  value,
  onSelect,
  title,
}: {
  value: string
  onSelect?: SelectHandler
  title?: string
}) {
  if (!value) return <span className="text-mono-s text-gray-04">—</span>
  if (!onSelect) {
    return <span className="text-mono-s break-all text-brand-dark-green">{value}</span>
  }

  return (
    <button
      type="button"
      title={title ?? `Look up ${value}`}
      onClick={() => onSelect(value)}
      className="text-mono-s cursor-pointer break-all text-left text-brand-dark-green underline decoration-gray-02 underline-offset-2 hover:decoration-brand-dark-green"
    >
      {value}
    </button>
  )
}

export function Field({
  label,
  value,
  onSelect,
}: {
  label: string
  value: string
  onSelect?: SelectHandler
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-eyebrow text-gray-05">{label}</dt>
      <dd>
        <Id value={value} onSelect={onSelect} />
      </dd>
    </div>
  )
}

export function RecordCard({
  kicker,
  title,
  children,
}: {
  kicker: string
  title: string
  children: ReactNode
}) {
  return (
    <article className="flex flex-col gap-4 border border-gray-01 bg-white p-5">
      <div className="flex flex-col gap-1">
        <p className="text-eyebrow text-gray-05">{kicker}</p>
        <h3 className="text-h4-sans break-all text-brand-dark-green">{title}</h3>
      </div>
      {children}
    </article>
  )
}

export function BlockCard({
  block,
  onSelect,
}: {
  block: BlockSummary
  onSelect?: SelectHandler
}) {
  return (
    <RecordCard kicker="Block" title={String(block.id)}>
      <dl className="flex flex-col gap-4">
        <Field label="Hash" value={block.hash} />
        <Field
          label="Previous block"
          value={block.previousHash}
          onSelect={onSelect}
        />
        <Field label="Timestamp" value={formatTimestamp(block.timestamp)} />
        <Field
          label="Transactions"
          value={`${block.transactionCount} · ${block.status}`}
        />
      </dl>

      {block.transactions.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-gray-01 pt-4">
          {block.transactions.map((tx) => (
            <TransactionCard key={tx.hash} tx={tx} onSelect={onSelect} />
          ))}
        </div>
      )}
    </RecordCard>
  )
}

export function TransactionCard({
  tx,
  onSelect,
}: {
  tx: TransactionSummary
  onSelect?: SelectHandler
}) {
  return (
    <RecordCard kicker={`Transaction · ${tx.kind}`} title={shortenHash(tx.hash)}>
      <dl className="flex flex-col gap-4">
        <Field label="Hash" value={tx.hash} />
        <Field label="Program" value={tx.programId} onSelect={onSelect} />
        <Field
          label="Zero-knowledge proof"
          value={tx.hasProof ? 'present' : 'none on this transaction'}
        />
        <div className="flex flex-col gap-1">
          <dt className="text-eyebrow text-gray-05">
            Accounts touched ({tx.accountIds.length})
          </dt>
          <dd className="flex flex-col gap-1">
            {tx.accountIds.length === 0 ? (
              <span className="text-mono-s text-gray-04">none</span>
            ) : (
              tx.accountIds.map((id) => (
                <Id key={id} value={id} onSelect={onSelect} />
              ))
            )}
          </dd>
        </div>
      </dl>
    </RecordCard>
  )
}

export function AccountCard({
  account,
  onSelect,
  children,
}: {
  account: AccountSummary
  onSelect?: SelectHandler
  children?: ReactNode
}) {
  return (
    <RecordCard kicker="Account" title={shortenHash(account.id)}>
      <dl className="flex flex-col gap-4">
        <Field label="Address" value={account.id} />
        <Field label="Balance" value={String(account.balance)} />
        <Field label="Nonce" value={String(account.nonce)} />
        <Field
          label="Owning program"
          value={account.programOwner}
          onSelect={onSelect}
        />
        {account.data && <Field label="Data (base64)" value={account.data} />}
      </dl>
      {children}
    </RecordCard>
  )
}
