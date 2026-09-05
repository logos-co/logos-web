'use client'

import { Button } from '@acid-info/logos-ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { AccountPanel } from '@/components/account-panel'
import { BlockCard, TransactionCard } from '@/components/chain-records'
import { ChainBlocks } from '@/components/chain-blocks'
import { useChainSearch } from '@/components/use-chain-search'
import { isEmptyResults } from '@/lib/blockchain'

/**
 * The interactive half of the blockchain demo.
 *
 * Search and the recent-block list live in one component because every hash and
 * address on the page is followable: clicking one runs a search, so the two
 * halves have to share state. Following also writes the query into the URL, so
 * a block or an account someone found can be sent to someone else.
 */
export function ChainExplorer() {
  const router = useRouter()
  const params = useSearchParams()
  const urlQuery = params.get('q') ?? ''

  const { query, results, isSearching, error, hasSearched, search, clear } =
    useChainSearch()
  const [draft, setDraft] = useState(urlQuery)

  // The URL is the source of truth, so a shared link, the back button and a
  // click on a hash all arrive the same way.
  useEffect(() => {
    setDraft(urlQuery)
    if (urlQuery) void search(urlQuery)
    else clear()
  }, [urlQuery, search, clear])

  const goTo = useCallback(
    (next: string) => {
      const trimmed = next.trim()
      router.replace(trimmed ? `/blockchain?q=${encodeURIComponent(trimmed)}` : '/blockchain', {
        scroll: false,
      })
    },
    [router],
  )

  const foundNothing =
    hasSearched && !isSearching && !error && isEmptyResults(results)

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          goTo(draft)
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
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
        {urlQuery && (
          <Button
            type="button"
            variant="secondary"
            icon={false}
            onClick={() => goTo('')}
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
            <BlockCard key={block.hash} block={block} onSelect={goTo} />
          ))}
          {results.transactions.map((tx) => (
            <TransactionCard key={tx.hash} tx={tx} onSelect={goTo} />
          ))}
          {results.accounts.map((account) => (
            <AccountPanel key={account.id} account={account} onSelect={goTo} />
          ))}
        </div>
      )}

      <ChainBlocks onSelect={goTo} />
    </div>
  )
}
