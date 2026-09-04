import { NextResponse } from 'next/server'

import { parseBlocks } from '@/lib/blockchain'

/**
 * Server-side proxy for the LEZ block explorer.
 *
 * The explorer answers happily but sends no CORS headers, so the browser cannot
 * call it from this origin. Server to server there is no such restriction, so
 * this route makes the call and hands the result to the page.
 *
 * This is the one demo in the app with a server of ours in the path. It stays
 * narrow on purpose: read-only, public block data, no keys, no user content and
 * no writes. Anything beyond that is a different thing and needs its own
 * argument.
 */

const EXPLORER_ORIGIN = 'https://explorer.testnet.lez.logos.co'
const BLOCK_LIMIT = 12

/**
 * The explorer is a Leptos app and its server-function URLs carry a hash that
 * changes whenever it is rebuilt. This is the value seen on 2026-09-04; if it
 * stops working the hash is recovered from the WASM at runtime.
 */
const KNOWN_GET_BLOCKS_PATH = '/api/get_blocks3022937127152978530'

/** Cached across invocations on a warm instance so the WASM is rarely fetched. */
let resolvedPath: string | null = null

/**
 * Recover the current `get_blocks` server-function path from the explorer's
 * WASM. The paths are plain ASCII in the binary, so a scan is enough and beats
 * failing the demo every time they rebuild.
 */
async function discoverGetBlocksPath(): Promise<string | null> {
  const response = await fetch(`${EXPLORER_ORIGIN}/pkg/explorer_service.wasm`, {
    next: { revalidate: 3600 },
  })
  if (!response.ok) return null

  const text = new TextDecoder('utf8', { fatal: false }).decode(
    await response.arrayBuffer(),
  )
  return text.match(/\/api\/get_blocks\d+/)?.[0] ?? null
}

async function requestBlocks(path: string): Promise<Response> {
  return fetch(`${EXPLORER_ORIGIN}${path}`, {
    method: 'POST',
    // Form encoding, not JSON. The server function rejects a JSON body with
    // "missing field `limit`" even when the JSON plainly contains it.
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ limit: String(BLOCK_LIMIT) }),
    // Someone else's testnet. Every visitor polling would be rude, so answers
    // are shared for a few seconds.
    next: { revalidate: 10 },
  })
}

export async function GET() {
  try {
    let path = resolvedPath ?? KNOWN_GET_BLOCKS_PATH
    let response = await requestBlocks(path)

    // A 404 means the explorer was rebuilt and the hash moved.
    if (response.status === 404) {
      const discovered = await discoverGetBlocksPath()
      if (discovered && discovered !== path) {
        path = discovered
        response = await requestBlocks(path)
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `The explorer answered ${response.status}.` },
        { status: 502 },
      )
    }

    resolvedPath = path
    const blocks = parseBlocks(await response.json())

    return NextResponse.json(
      { blocks, fetchedAt: Date.now() },
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=10' } },
    )
  } catch {
    // The explorer is a testnet service and goes away sometimes. Say so rather
    // than leaving the page spinning.
    return NextResponse.json(
      { error: 'Could not reach the block explorer.' },
      { status: 502 },
    )
  }
}
