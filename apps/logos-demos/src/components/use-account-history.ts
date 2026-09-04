'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { AccountSummary, TransactionSummary } from '@/lib/blockchain'
import { parseAccount, parseTransactionSummaries } from '@/lib/blockchain'

export type AccountHistory = {
  account: AccountSummary | null
  transactions: TransactionSummary[]
  hasMore: boolean
  isLoading: boolean
  error: string | null
}

const INITIAL: AccountHistory = {
  account: null,
  transactions: [],
  hasMore: false,
  isLoading: false,
  error: null,
}

/**
 * An account's details and its transactions, paged.
 *
 * Pages accumulate rather than replace, so "show more" grows the list the way a
 * reader expects instead of jumping them to page two.
 */
export function useAccountHistory(id: string | null) {
  const [state, setState] = useState<AccountHistory>(INITIAL)

  // Guards against a slow first page landing after a later one.
  const requestedIdRef = useRef<string | null>(null)

  const load = useCallback(
    async (accountId: string, offset: number) => {
      requestedIdRef.current = accountId
      setState((current) => ({ ...current, isLoading: true, error: null }))

      try {
        const response = await fetch(
          `/api/blockchain/account?id=${encodeURIComponent(accountId)}&offset=${offset}`,
        )
        const payload: unknown = await response.json()
        if (requestedIdRef.current !== accountId) return

        if (!response.ok) {
          setState((current) => ({
            ...current,
            isLoading: false,
            error: 'Could not load this account.',
          }))
          return
        }

        const {
          account,
          transactions,
          hasMore,
        } = payload as Record<string, unknown>

        setState((current) => ({
          account: parseAccount(account, accountId) ?? current.account,
          transactions:
            offset === 0
              ? parseTransactionSummaries(transactions)
              : [
                  ...current.transactions,
                  ...parseTransactionSummaries(transactions),
                ],
          hasMore: hasMore === true,
          isLoading: false,
          error: null,
        }))
      } catch {
        if (requestedIdRef.current !== accountId) return
        setState((current) => ({
          ...current,
          isLoading: false,
          error: 'Could not load this account.',
        }))
      }
    },
    [],
  )

  useEffect(() => {
    if (!id) {
      requestedIdRef.current = null
      setState(INITIAL)
      return
    }
    setState(INITIAL)
    void load(id, 0)
  }, [id, load])

  const loadMore = useCallback(() => {
    if (!id || state.isLoading || !state.hasMore) return
    void load(id, state.transactions.length)
  }, [id, load, state.hasMore, state.isLoading, state.transactions.length])

  return { ...state, loadMore }
}
