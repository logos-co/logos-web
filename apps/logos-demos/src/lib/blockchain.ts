// Shapes and helpers for the LEZ block explorer data. Framework-free, and
// shared by the route handler and the UI.

/** Blocks are produced about once a minute, so anything older is a stall. */
const STALL_THRESHOLD_MS = 5 * 60 * 1000

export type BlockSummary = {
  id: number
  hash: string
  previousHash: string
  /** Milliseconds since the epoch. */
  timestamp: number
  transactionCount: number
  /** Bedrock status as the explorer reports it, e.g. "Finalized". */
  status: string
}

export type ChainSnapshot = {
  blocks: BlockSummary[]
  /** When this browser last received an answer. */
  fetchedAt: number
}

export type ChainLiveness =
  | { state: 'unknown' }
  | { state: 'live'; ageMs: number }
  | { state: 'stalled'; ageMs: number }

/**
 * Validate one block as the explorer returns it. The response comes from a
 * service we do not control, so a shape that does not match is dropped rather
 * than rendered.
 */
export function parseBlock(raw: unknown): BlockSummary | null {
  if (typeof raw !== 'object' || raw === null) return null

  const { header, body, bedrock_status: status } = raw as Record<string, unknown>
  if (typeof header !== 'object' || header === null) return null

  const {
    block_id: id,
    hash,
    prev_block_hash: previousHash,
    timestamp,
  } = header as Record<string, unknown>

  if (typeof id !== 'number' || !Number.isFinite(id)) return null
  if (typeof hash !== 'string' || typeof previousHash !== 'string') return null
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return null

  const transactions = (body as Record<string, unknown> | undefined)
    ?.transactions

  return {
    id,
    hash,
    previousHash,
    timestamp,
    transactionCount: Array.isArray(transactions) ? transactions.length : 0,
    status: typeof status === 'string' ? status : 'Unknown',
  }
}

export function parseBlocks(raw: unknown): BlockSummary[] {
  if (!Array.isArray(raw)) return []
  return sortNewestFirst(raw.map(parseBlock))
}

/**
 * Validate a block that has already been through `parseBlock` once, as the
 * proxy returns it. This is a different shape from the explorer's, and using
 * the raw parser here silently drops every row.
 */
export function parseSummary(raw: unknown): BlockSummary | null {
  if (typeof raw !== 'object' || raw === null) return null

  const { id, hash, previousHash, timestamp, transactionCount, status } =
    raw as Record<string, unknown>

  if (typeof id !== 'number' || !Number.isFinite(id)) return null
  if (typeof hash !== 'string' || typeof previousHash !== 'string') return null
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return null

  return {
    id,
    hash,
    previousHash,
    timestamp,
    transactionCount:
      typeof transactionCount === 'number' && Number.isFinite(transactionCount)
        ? transactionCount
        : 0,
    status: typeof status === 'string' ? status : 'Unknown',
  }
}

export function parseSummaries(raw: unknown): BlockSummary[] {
  if (!Array.isArray(raw)) return []
  return sortNewestFirst(raw.map(parseSummary))
}

function sortNewestFirst(blocks: (BlockSummary | null)[]): BlockSummary[] {
  return blocks
    .filter((block): block is BlockSummary => block !== null)
    .sort((a, b) => b.id - a.id)
}

/**
 * Whether the chain is still producing. The testnet has sat idle for days at a
 * time, and a block list alone gives no hint of that: the numbers look the same
 * whether the last one arrived a minute or a week ago.
 */
export function readLiveness(
  blocks: BlockSummary[],
  now: number,
): ChainLiveness {
  const newest = blocks[0]
  if (!newest) return { state: 'unknown' }

  const ageMs = now - newest.timestamp
  return ageMs <= STALL_THRESHOLD_MS
    ? { state: 'live', ageMs }
    : { state: 'stalled', ageMs }
}

export function shortenHash(hash: string): string {
  return hash.length <= 18 ? hash : `${hash.slice(0, 8)}…${hash.slice(-8)}`
}

/** "3 minutes ago", "5 days ago". Coarse on purpose. */
export function formatAge(ms: number): string {
  const units: [label: string, size: number][] = [
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
  ]

  for (const [label, size] of units) {
    const value = Math.floor(ms / size)
    if (value >= 1) return `${value} ${label}${value === 1 ? '' : 's'} ago`
  }
  return 'just now'
}

export function formatTimestamp(ms: number): string {
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
}
