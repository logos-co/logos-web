'use client'

import { Button } from '@acid-info/logos-ui'

import { AccountCard, type SelectHandler } from '@/components/chain-records'
import { TransactionCard } from '@/components/chain-records'
import { useAccountHistory } from '@/components/use-account-history'
import type { AccountSummary } from '@/lib/blockchain'

/**
 * An account with its transaction history.
 *
 * Search answers "what is this address". This answers "and what has it done",
 * which is the question anyone has next.
 */
export function AccountPanel({
  account,
  onSelect,
}: {
  account: AccountSummary
  onSelect?: SelectHandler
}) {
  const { transactions, hasMore, isLoading, error, loadMore } =
    useAccountHistory(account.id)

  return (
    <AccountCard account={account} onSelect={onSelect}>
      <div className="flex flex-col gap-3 border-t border-gray-01 pt-4">
        <p className="text-eyebrow text-gray-05">
          Transactions{transactions.length > 0 ? ` (${transactions.length}${hasMore ? '+' : ''})` : ''}
        </p>

        {error && (
          <p role="alert" className="text-caption-sans text-accent-purple">
            {error}
          </p>
        )}

        {isLoading && transactions.length === 0 && (
          <p className="text-caption-sans text-gray-04">Loading history…</p>
        )}

        {!isLoading && !error && transactions.length === 0 && (
          <p className="text-caption-sans text-gray-04">
            The explorer has no transactions indexed for this account.
          </p>
        )}

        {transactions.map((tx) => (
          <TransactionCard key={tx.hash} tx={tx} onSelect={onSelect} />
        ))}

        {hasMore && (
          <Button
            type="button"
            variant="secondary"
            icon={false}
            disabled={isLoading}
            onClick={loadMore}
            className="cursor-pointer self-start"
          >
            {isLoading ? 'Loading' : 'Show more'}
          </Button>
        )}
      </div>
    </AccountCard>
  )
}
