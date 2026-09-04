'use client'

import { Button } from '@acid-info/logos-ui'
import { useState } from 'react'

import {
  AccountCard,
  BlockCard,
  TransactionCard,
} from '@/components/chain-records'
import { useChainSearch } from '@/components/use-chain-search'
import { isEmptyResults } from '@/lib/blockchain'

export function ChainSearch() {
  const { query, results, isSearching, error, hasSearched, search, clear } =
    useChainSearch()
  const [draft, setDraft] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void search(draft)
  }

  const handleClear = () => {
    setDraft('')
    clear()
  }

  const foundNothing = hasSearched && !isSearching && !error && isEmptyResults(results)

  return (
    <section className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Block number, transaction hash, or account address"
          maxLength={128}
          aria-label="Search the chain"
          className="text-body-sans flex-1 border border-gray-01 bg-white px-3 py-2.5 text-brand-dark-green placeholder:text-gray-04"
        />
        <Button
          type="submit"
          variant="primary"
          icon={false}
          disabled={isSearching || draft.trim().length === 0}
          className="cursor-pointer"
        >
          {isSearching ? 'Searching' : 'Search'}
        </Button>
        {hasSearched && (
          <Button
            type="button"
            variant="secondary"
            icon={false}
            onClick={handleClear}
            className="cursor-pointer"
          >
            Clear
          </Button>
        )}
      </form>

      {error && (
        <p role="alert" className="text-caption-sans text-accent-purple">
          {error}
        </p>
      )}

      {foundNothing && (
        <p className="text-body-sans text-gray-05">
          Nothing matches <span className="text-mono-s">{query}</span>. The
          explorer recognises a block number, a full transaction hash, or an
          account address. Its index also runs behind the chain head, so
          something very recent may not be findable yet.
        </p>
      )}

      {!isEmptyResults(results) && (
        <div className="flex flex-col gap-4">
          {results.blocks.map((block) => (
            <BlockCard key={block.hash} block={block} />
          ))}
          {results.transactions.map((tx) => (
            <TransactionCard key={tx.hash} tx={tx} />
          ))}
          {results.accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </section>
  )
}
