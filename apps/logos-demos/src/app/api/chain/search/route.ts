import { NextResponse } from 'next/server'

import { getFresh, LEAD_NODE } from '@/lib/chain-nodes'
import { isChainId, MAX_CHAIN_ID_LENGTH } from '@/lib/chain-query'
import { parseBlock, parseChainTime } from '@/lib/cryptarchia'

/**
 * Resolves one query against the node.
 *
 * The node has no unified search, so this tries each lookup that could match
 * and reports whichever answered. A query that matches nothing comes back as
 * `kind: "none"` rather than an error, because not finding something is an
 * ordinary outcome. So is a query that is not a chain id: it never reaches
 * the node.
 */

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''

  if (!query) {
    return NextResponse.json({ kind: 'none', query: '' })
  }
  if (query.length > MAX_CHAIN_ID_LENGTH) {
    return NextResponse.json(
      { error: 'That query is too long to be a block, transaction or address.' },
      { status: 400 },
    )
  }

  if (!isChainId(query)) {
    return NextResponse.json({ kind: 'none', query })
  }

  const id = encodeURIComponent(query)

  try {
    // Blocks first: it is the only one that resolves today, since the testnet
    // is carrying no transactions.
    const block = await getFresh(`${LEAD_NODE}/cryptarchia/blocks/${id}`)
    if (block.ok) {
      const time = parseChainTime(
        await (await getFresh(`${LEAD_NODE}/time/info`)).json().catch(() => null),
      )
      return NextResponse.json({
        kind: 'block',
        query,
        block: parseBlock(await block.json(), time),
      })
    }

    const tx = await getFresh(`${LEAD_NODE}/cryptarchia/transaction/${id}`)
    if (tx.ok) {
      return NextResponse.json({
        kind: 'transaction',
        query,
        transaction: await tx.json(),
      })
    }

    const account = await getFresh(`${LEAD_NODE}/wallet/${id}/balance`)
    if (account.ok) {
      return NextResponse.json({
        kind: 'account',
        query,
        account: await account.json(),
      })
    }

    return NextResponse.json({ kind: 'none', query })
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the testnet node.' },
      { status: 502 },
    )
  }
}
