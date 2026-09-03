// Thin, framework-free wrapper around @waku/sdk.
//
// Everything here runs in the BROWSER: the page has no backend. A visitor's
// browser starts a Waku light node, dials the public fleet over secure
// websockets, and sends/receives messages directly on the network. Nothing
// this file does touches a server we operate.
//
// Kept free of React so it can be lifted into a shared package (or a
// non-React app) unchanged.

/**
 * Waku content topic: /<app>/<version>/<topic>/<encoding>.
 *
 * Nothing published to Waku can be deleted — store nodes hold it for their
 * retention window, and there is no delete primitive to reach for. Bumping the
 * version is how this demo gets a clean room: the old traffic still exists on
 * the old topic, and nobody is listening to it any more.
 */
export const CONTENT_TOPIC = '/logos-demos/2/messaging/proto'

/** Wire shape of a chat message. Kept tiny and versioned. */
export type ChatPayload = {
  v: 1
  /**
   * Sender-generated nonce. The network can deliver the same message more than
   * once (and echoes back what we publish), so this is what de-duplicates the
   * list and tells us which messages are our own.
   */
  id: string
  nickname: string
  text: string
  sentAt: number
}

/** A message as the UI renders it. */
export type ChatMessage = ChatPayload & {
  /** True when this browser is the sender. */
  fromSelf: boolean
}

export type NodeStatus = 'idle' | 'starting' | 'connecting' | 'ready' | 'failed'

export type NodeSnapshot = {
  status: NodeStatus
  peerCount: number
  peerIds: string[]
  /** Our own libp2p peer id — this browser's identity on the network. */
  selfPeerId: string | null
  error: string | null
  /** True while store nodes are being queried for the backlog. */
  isLoadingHistory: boolean
}

const MAX_TEXT_LENGTH = 512

export function isBlank(value: string): boolean {
  return value.trim().length === 0
}

/**
 * Validate and normalise anything arriving off the wire. Messages come from
 * strangers on a public network, so nothing is trusted: a payload that does not
 * match the contract is dropped rather than rendered.
 */
export function parsePayload(raw: unknown): ChatPayload | null {
  if (typeof raw !== 'object' || raw === null) return null

  const candidate = raw as Record<string, unknown>
  const { v, id, nickname, text, sentAt } = candidate

  if (v !== 1) return null
  if (typeof id !== 'string' || isBlank(id)) return null
  if (typeof nickname !== 'string' || typeof text !== 'string') return null
  if (typeof sentAt !== 'number' || !Number.isFinite(sentAt)) return null
  if (isBlank(text)) return null

  return {
    v: 1,
    id: id.slice(0, 64),
    nickname: nickname.slice(0, 32).trim() || 'anonymous',
    text: text.slice(0, MAX_TEXT_LENGTH),
    sentAt,
  }
}

export function encodePayload(payload: ChatPayload): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(payload))
}

export function decodePayload(bytes: Uint8Array): ChatPayload | null {
  try {
    return parsePayload(JSON.parse(new TextDecoder().decode(bytes)))
  } catch {
    // Malformed JSON on a public topic is expected, not exceptional.
    return null
  }
}

export function buildPayload(nickname: string, text: string): ChatPayload {
  return {
    v: 1,
    id: crypto.randomUUID(),
    nickname: isBlank(nickname) ? 'anonymous' : nickname.trim().slice(0, 32),
    text: text.trim().slice(0, MAX_TEXT_LENGTH),
    sentAt: Date.now(),
  }
}

export function shortenPeerId(peerId: string): string {
  return peerId.length <= 14
    ? peerId
    : `${peerId.slice(0, 6)}…${peerId.slice(-6)}`
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
