'use client'

import type {
  AccountSummary,
  BlockSummary,
  TransactionSummary,
} from '@/lib/blockchain'
import { formatTimestamp, shortenHash } from '@/lib/blockchain'

/** One labelled value. Long ids wrap rather than overflow. */
export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-eyebrow text-gray-05">{label}</dt>
      <dd className="text-mono-s break-all text-brand-dark-green">{value}</dd>
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
  children: React.ReactNode
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

export function BlockCard({ block }: { block: BlockSummary }) {
  return (
    <RecordCard kicker="Block" title={String(block.id)}>
      <dl className="flex flex-col gap-4">
        <Field label="Hash" value={block.hash} />
        <Field label="Previous" value={block.previousHash} />
        <Field label="Timestamp" value={formatTimestamp(block.timestamp)} />
        <Field
          label="Transactions"
          value={`${block.transactionCount} · ${block.status}`}
        />
      </dl>
    </RecordCard>
  )
}

export function TransactionCard({ tx }: { tx: TransactionSummary }) {
  return (
    <RecordCard kicker={`Transaction · ${tx.kind}`} title={shortenHash(tx.hash)}>
      <dl className="flex flex-col gap-4">
        <Field label="Hash" value={tx.hash} />
        <Field label="Program" value={tx.programId || '—'} />
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
                <span key={id} className="text-mono-s break-all text-brand-dark-green">
                  {id}
                </span>
              ))
            )}
          </dd>
        </div>
      </dl>
    </RecordCard>
  )
}

export function AccountCard({ account }: { account: AccountSummary }) {
  return (
    <RecordCard kicker="Account" title={shortenHash(account.id)}>
      <dl className="flex flex-col gap-4">
        <Field label="Address" value={account.id} />
        <Field label="Balance" value={String(account.balance)} />
        <Field label="Nonce" value={String(account.nonce)} />
        <Field label="Owning program" value={account.programOwner || '—'} />
        {account.data && <Field label="Data (base64)" value={account.data} />}
      </dl>
    </RecordCard>
  )
}
