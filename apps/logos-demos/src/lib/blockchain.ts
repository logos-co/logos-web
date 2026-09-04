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
  /**
   * The block's transactions. They ride along in the same response, so a row
   * can be expanded without asking the explorer a second time.
   */
  transactions: TransactionSummary[]
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

  const parsedTransactions = parseTransactions(transactions)

  return {
    id,
    hash,
    previousHash,
    timestamp,
    transactionCount: Array.isArray(transactions) ? transactions.length : 0,
    status: typeof status === 'string' ? status : 'Unknown',
    transactions: parsedTransactions,
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

  const {
    id,
    hash,
    previousHash,
    timestamp,
    transactionCount,
    status,
    transactions,
  } = raw as Record<string, unknown>

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
    transactions: Array.isArray(transactions)
      ? transactions.filter(
          (tx): tx is TransactionSummary =>
            typeof tx === 'object' && tx !== null && 'hash' in tx,
        )
      : [],
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

// ── Transactions ────────────────────────────────────────────────────────────

/**
 * A transaction as the explorer returns it. The wire form is an externally
 * tagged enum, `{ "Public": { ... } }`, and today `Public` is the only variant
 * seen on this testnet. The tag is kept because a private variant is the whole
 * point of the chain and will show up eventually.
 */
export type TransactionSummary = {
  kind: string
  hash: string
  /** The program this transaction invoked. */
  programId: string
  /** Accounts the transaction touches. */
  accountIds: string[]
  /** True when a zero-knowledge proof accompanied the transaction. */
  hasProof: boolean
}

export function parseTransaction(raw: unknown): TransactionSummary | null {
  if (typeof raw !== 'object' || raw === null) return null

  const [kind, value] = Object.entries(raw as Record<string, unknown>)[0] ?? []
  if (typeof kind !== 'string' || typeof value !== 'object' || value === null) {
    return null
  }

  const { hash, message, witness_set: witness } = value as Record<string, unknown>
  if (typeof hash !== 'string') return null

  const { program_id: programId, account_ids: accountIds } =
    (message as Record<string, unknown> | undefined) ?? {}

  return {
    kind,
    hash,
    programId: typeof programId === 'string' ? programId : '',
    accountIds: Array.isArray(accountIds)
      ? accountIds.filter((id): id is string => typeof id === 'string')
      : [],
    hasProof:
      typeof witness === 'object' &&
      witness !== null &&
      (witness as Record<string, unknown>).proof != null,
  }
}

export function parseTransactions(raw: unknown): TransactionSummary[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(parseTransaction)
    .filter((tx): tx is TransactionSummary => tx !== null)
}

// ── Accounts ────────────────────────────────────────────────────────────────

export type AccountSummary = {
  id: string
  programOwner: string
  balance: number
  nonce: number
  /** Opaque account data, base64 as the explorer returns it. */
  data: string
}

export function parseAccount(raw: unknown, id: string): AccountSummary | null {
  if (typeof raw !== 'object' || raw === null) return null

  const {
    program_owner: programOwner,
    balance,
    nonce,
    data,
  } = raw as Record<string, unknown>

  return {
    id,
    programOwner: typeof programOwner === 'string' ? programOwner : '',
    balance: typeof balance === 'number' ? balance : 0,
    nonce: typeof nonce === 'number' ? nonce : 0,
    data: typeof data === 'string' ? data : '',
  }
}

// ── Search ──────────────────────────────────────────────────────────────────

/**
 * One search box covers the lot: the explorer decides whether a query is a
 * block id, a transaction hash or an account id and answers with whichever
 * matched.
 */
export type SearchResults = {
  blocks: BlockSummary[]
  transactions: TransactionSummary[]
  accounts: AccountSummary[]
}

export const EMPTY_RESULTS: SearchResults = {
  blocks: [],
  transactions: [],
  accounts: [],
}

export function isEmptyResults(results: SearchResults): boolean {
  return (
    results.blocks.length === 0 &&
    results.transactions.length === 0 &&
    results.accounts.length === 0
  )
}

/**
 * Parse the explorer's own search payload.
 *
 * Accounts arrive as `[id, account]` tuples here, unlike `get_account`, which
 * returns the account alone. Reading them as plain objects yields a card with
 * every field blank rather than an error, so the shape is handled explicitly.
 */
export function parseSearchResults(raw: unknown): SearchResults {
  if (typeof raw !== 'object' || raw === null) return EMPTY_RESULTS

  const { blocks, transactions, accounts } = raw as Record<string, unknown>

  return {
    blocks: parseBlocks(blocks),
    transactions: parseTransactions(transactions),
    accounts: Array.isArray(accounts)
      ? accounts
          .map((entry) => {
            if (!Array.isArray(entry)) return null
            const [id, account] = entry
            return typeof id === 'string' ? parseAccount(account, id) : null
          })
          .filter((account): account is AccountSummary => account !== null)
      : [],
  }
}

/** Parse the search payload this app's proxy returns, which is already normalised. */
export function parseSearchPayload(raw: unknown): SearchResults {
  if (typeof raw !== 'object' || raw === null) return EMPTY_RESULTS

  const { blocks, transactions, accounts } = raw as Record<string, unknown>

  return {
    blocks: parseSummaries(blocks),
    transactions: Array.isArray(transactions)
      ? transactions.filter(
          (tx): tx is TransactionSummary =>
            typeof tx === 'object' && tx !== null && 'hash' in tx,
        )
      : [],
    accounts: Array.isArray(accounts)
      ? accounts.filter(
          (account): account is AccountSummary =>
            typeof account === 'object' && account !== null && 'id' in account,
        )
      : [],
  }
}
