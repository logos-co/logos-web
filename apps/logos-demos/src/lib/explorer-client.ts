/**
 * Server-side client for the LEZ block explorer.
 *
 * Import this from route handlers only. It is not marked with `server-only`
 * because that would mean a dependency for a single guard, so the rule is kept
 * by convention: nothing under `src/components` should reach for it.
 *
 * The explorer answers requests but sends no CORS headers, so a browser on this
 * origin cannot call it. Server to server there is no such restriction, so the
 * route handlers call through here instead.
 *
 * Everything it can do is read-only. The explorer exposes seven server
 * functions, all of them `get_*` or `search`, and there is no write endpoint to
 * reach even if we wanted one.
 */

const EXPLORER_ORIGIN = 'https://explorer.testnet.lez.logos.co'

/** How long answers are shared for. The explorer is someone else's testnet. */
const CACHE_SECONDS = 10

export type ExplorerFunction =
  | 'get_blocks'
  | 'get_block_by_id'
  | 'get_block_by_hash'
  | 'get_transaction'
  | 'get_account'
  | 'get_transactions_by_account'
  | 'search'

/**
 * Server-function paths carry a build hash that moves whenever the explorer is
 * rebuilt. These are the values seen on 2026-09-04; when one stops working the
 * current hash is recovered from the WASM.
 */
const KNOWN_HASH = '3022937127152978530'

/** Resolved hash, cached across invocations on a warm instance. */
let currentHash: string | null = null

/**
 * Recover the hash from the explorer's WASM. The paths are plain ASCII in the
 * binary, so a scan finds them, which beats breaking every time they deploy.
 */
async function discoverHash(): Promise<string | null> {
  const response = await fetch(`${EXPLORER_ORIGIN}/pkg/explorer_service.wasm`, {
    next: { revalidate: 3600 },
  })
  if (!response.ok) return null

  const text = new TextDecoder('utf8', { fatal: false }).decode(
    await response.arrayBuffer(),
  )
  return text.match(/\/api\/get_blocks(\d+)/)?.[1] ?? null
}

async function post(
  fn: ExplorerFunction,
  hash: string,
  args: Record<string, string>,
): Promise<Response> {
  return fetch(`${EXPLORER_ORIGIN}/api/${fn}${hash}`, {
    method: 'POST',
    // Form encoding, not JSON. The server functions reject a JSON body with
    // "missing field `limit`" even when the JSON plainly contains it.
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(args),
    next: { revalidate: CACHE_SECONDS },
  })
}

export class ExplorerError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ExplorerError'
  }
}

/**
 * Call one explorer server function and return its parsed JSON.
 *
 * A 404 means the build hash moved, so the hash is re-resolved once and the
 * call retried. Anything else is surfaced as an `ExplorerError`.
 */
export async function callExplorer(
  fn: ExplorerFunction,
  args: Record<string, string>,
): Promise<unknown> {
  let hash = currentHash ?? KNOWN_HASH
  let response = await post(fn, hash, args)

  if (response.status === 404) {
    const discovered = await discoverHash()
    if (discovered && discovered !== hash) {
      hash = discovered
      response = await post(fn, hash, args)
    }
  }

  if (!response.ok) {
    throw new ExplorerError(
      `The explorer answered ${response.status}.`,
      response.status,
    )
  }

  currentHash = hash
  return response.json()
}

export { CACHE_SECONDS }
