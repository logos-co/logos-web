import { NextResponse } from 'next/server'

import { parseAccount, parseTransactions } from '@/lib/blockchain'
import { CACHE_SECONDS, callExplorer, ExplorerError } from '@/lib/explorer-client'

/**
 * One account and a page of its transactions.
 *
 * Search alone answers "what is this address"; this answers "and what has it
 * done", which is the question anyone actually has next.
 */

const PAGE_SIZE = 10
const MAX_ID_LENGTH = 128

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const id = params.get('id')?.trim() ?? ''
  const offset = Number(params.get('offset') ?? '0')

  if (!id || id.length > MAX_ID_LENGTH) {
    return NextResponse.json({ error: 'Missing account id.' }, { status: 400 })
  }
  if (!Number.isInteger(offset) || offset < 0) {
    return NextResponse.json({ error: 'Bad offset.' }, { status: 400 })
  }

  try {
    // One extra row is requested so "is there more" needs no second call.
    const [rawAccount, rawTransactions] = await Promise.all([
      callExplorer('get_account', { account_id: id }),
      callExplorer('get_transactions_by_account', {
        account_id: id,
        offset: String(offset),
        limit: String(PAGE_SIZE + 1),
      }),
    ])

    const page = parseTransactions(rawTransactions)
    const hasMore = page.length > PAGE_SIZE

    return NextResponse.json(
      {
        account: parseAccount(rawAccount, id),
        transactions: hasMore ? page.slice(0, PAGE_SIZE) : page,
        offset,
        hasMore,
      },
      {
        headers: {
          'Cache-Control': `public, max-age=0, s-maxage=${CACHE_SECONDS}`,
        },
      },
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof ExplorerError
            ? error.message
            : 'Could not reach the block explorer.',
      },
      { status: 502 },
    )
  }
}

export { PAGE_SIZE }
