import { NextResponse } from 'next/server'

import { EMPTY_RESULTS, parseSearchResults } from '@/lib/blockchain'
import { CACHE_SECONDS, callExplorer, ExplorerError } from '@/lib/explorer-client'

/**
 * One search across blocks, transactions and accounts.
 *
 * The explorer works out for itself whether a query is a block id, a
 * transaction hash or an account id, so the page needs one box rather than
 * three, and an unrecognised query comes back as empty rather than an error.
 */

/** Long enough for any id the chain uses, short enough to not be a payload. */
const MAX_QUERY_LENGTH = 128

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''

  if (!query) {
    return NextResponse.json({ ...EMPTY_RESULTS, query: '' })
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: 'That query is too long to be a block, transaction or account.' },
      { status: 400 },
    )
  }

  try {
    const results = parseSearchResults(await callExplorer('search', { query }))

    return NextResponse.json(
      { ...results, query },
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
