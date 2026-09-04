import { NextResponse } from 'next/server'

import { parseBlocks } from '@/lib/blockchain'
import { CACHE_SECONDS, callExplorer, ExplorerError } from '@/lib/explorer-client'

/**
 * Recent blocks, read through the explorer.
 *
 * See src/lib/explorer-client.ts for why this goes through a server of ours at
 * all, and how narrow the proxy is kept.
 */

const BLOCK_LIMIT = 12

export async function GET() {
  try {
    const blocks = parseBlocks(
      await callExplorer('get_blocks', { limit: String(BLOCK_LIMIT) }),
    )

    return NextResponse.json(
      { blocks, fetchedAt: Date.now() },
      {
        headers: {
          'Cache-Control': `public, max-age=0, s-maxage=${CACHE_SECONDS}`,
        },
      },
    )
  } catch (error) {
    // The explorer is a testnet service and goes away sometimes. Say so rather
    // than leaving the page spinning.
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
