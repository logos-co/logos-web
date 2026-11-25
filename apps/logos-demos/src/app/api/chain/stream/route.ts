import { LEAD_NODE } from '@/lib/chain-nodes'

/**
 * Forwards the node's live block stream to the browser.
 *
 * The node emits newline-delimited JSON on a long-lived connection, one object
 * per block carrying the block itself plus the new tip and last irreversible
 * block. This re-frames those lines as server-sent events, which the browser
 * can consume with `EventSource` and which reconnects on its own.
 *
 * The relay exists for the same reason the other routes do: the node is plain
 * HTTP and this app is HTTPS, so the browser is not allowed to open the
 * connection itself.
 */

/**
 * Held connections occupy a function instance, so this one lets go after a few
 * minutes and lets `EventSource` reconnect. Blocks arrive every 30 to 90
 * seconds, so a viewer still sees several per connection.
 */
export const maxDuration = 300
const STREAM_BUDGET_MS = 4 * 60 * 1000

/**
 * Blocks are 30 to 90 seconds apart, and a connection with nothing on it for
 * that long gets closed in between. A comment line every few seconds keeps it
 * open; `EventSource` ignores comments, so nothing reaches the page.
 */
const HEARTBEAT_MS = 15000

/**
 * Every open stream holds one connection to the lead node, so the relay caps
 * how many it holds at once. One viewer tab needs one stream; 20 covers a
 * room of people watching the demo while keeping a script that opens streams
 * in a loop from fanning out onto a single testnet node.
 */
export const MAX_CONCURRENT_STREAMS = 20
let openStreams = 0

/** Bounds the connect only. Once headers arrive the body may run its budget. */
const CONNECT_TIMEOUT_MS = 15000

export async function GET(request: Request) {
  if (openStreams >= MAX_CONCURRENT_STREAMS) {
    return new Response('Too many open streams.', {
      status: 503,
      headers: { 'Retry-After': '30' },
    })
  }
  openStreams += 1

  let released = false
  const release = () => {
    if (released) return
    released = true
    openStreams -= 1
  }

  const connect = new AbortController()
  const connectTimer = setTimeout(() => connect.abort(), CONNECT_TIMEOUT_MS)
  const abortUpstream = () => connect.abort()
  request.signal.addEventListener('abort', abortUpstream)

  let upstream: Response
  try {
    upstream = await fetch(`${LEAD_NODE}/cryptarchia/events/blocks/stream`, {
      signal: connect.signal,
      cache: 'no-store',
    })
  } catch {
    release()
    return new Response('Could not open the node stream.', { status: 502 })
  } finally {
    clearTimeout(connectTimer)
  }

  if (!upstream.ok || !upstream.body) {
    release()
    void upstream.body?.cancel().catch(() => {})
    return new Response('The node refused the stream.', { status: 502 })
  }

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // ndjson arrives in arbitrary chunks, so lines are reassembled here
      // rather than assuming one object per read.
      let buffer = ''

      const close = () => {
        release()
        request.signal.removeEventListener('abort', abortUpstream)
        void reader.cancel().catch(() => {})
        try {
          controller.close()
        } catch {
          // Already closed by the client going away.
        }
      }

      // Opening with a comment settles the connection immediately rather than
      // leaving it idle until the first block.
      controller.enqueue(encoder.encode(': open\n\n'))

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, HEARTBEAT_MS)

      // The client disconnecting must release the upstream connection too.
      request.signal.addEventListener('abort', close)

      // Cancelling the reader ends a read that is waiting for the next block.
      const budget = setTimeout(close, STREAM_BUDGET_MS)

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.trim()) continue
            controller.enqueue(encoder.encode(`data: ${line}\n\n`))
          }
        }
      } catch {
        // A dropped upstream is ordinary; the client will reconnect.
      } finally {
        clearInterval(heartbeat)
        clearTimeout(budget)
        close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
