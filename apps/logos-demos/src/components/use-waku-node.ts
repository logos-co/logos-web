'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  buildPayload,
  CONTENT_TOPIC,
  type ChatMessage,
  decodePayload,
  encodePayload,
  isBlank,
  type NodeSnapshot,
} from '@/lib/waku'

const PEER_POLL_INTERVAL_MS = 3000
const PEER_WAIT_TIMEOUT_MS = 30000

const INITIAL_SNAPSHOT: NodeSnapshot = {
  status: 'idle',
  peerCount: 0,
  peerIds: [],
  selfPeerId: null,
  error: null,
}

/**
 * Owns the lifetime of this browser's Waku light node.
 *
 * @waku/sdk is imported lazily, inside the effect, for two reasons: it reaches
 * for browser APIs that do not exist while Next renders on the server, and it
 * pulls in libp2p, which has no business in the initial bundle.
 */
export function useWakuNode() {
  const [snapshot, setSnapshot] = useState<NodeSnapshot>(INITIAL_SNAPSHOT)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Populated once the node is live. `send` reads these, so they are refs
  // rather than state — a re-render must not be required for sending to work.
  const nodeRef = useRef<Awaited<
    ReturnType<typeof import('@waku/sdk').createLightNode>
  > | null>(null)
  const encoderRef = useRef<ReturnType<
    NonNullable<typeof nodeRef.current>['createEncoder']
  > | null>(null)

  // Ids we have already rendered. The network re-delivers messages and echoes
  // our own publishes back, so every arrival is checked against this.
  const seenIdsRef = useRef<Set<string>>(new Set())

  const appendMessage = useCallback((message: ChatMessage) => {
    if (seenIdsRef.current.has(message.id)) return
    seenIdsRef.current.add(message.id)
    setMessages((current) =>
      [...current, message].sort((a, b) => a.sentAt - b.sentAt),
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    let peerPoll: ReturnType<typeof setInterval> | undefined
    let node: typeof nodeRef.current = null

    const patch = (next: Partial<NodeSnapshot>) => {
      if (cancelled) return
      setSnapshot((current) => ({ ...current, ...next }))
    }

    const run = async () => {
      const { createLightNode } = await import('@waku/sdk')

      patch({ status: 'starting' })
      // `defaultBootstrap` is what registers the peer-discovery mechanisms —
      // without it the node starts with none and never finds a peer. (The
      // `discovery` option's documented defaults only apply inside this flag.)
      // DNS discovery resolves the public fleets, which a browser can reach
      // over secure websockets.
      node = await createLightNode({ defaultBootstrap: true })

      // The user may have navigated away while the node was starting.
      if (cancelled) {
        await node.stop()
        return
      }

      nodeRef.current = node
      patch({ status: 'connecting', selfPeerId: node.peerId.toString() })

      await node.waitForPeers(undefined, PEER_WAIT_TIMEOUT_MS)
      if (cancelled) return

      encoderRef.current = node.createEncoder({ contentTopic: CONTENT_TOPIC })
      const decoder = node.createDecoder({ contentTopic: CONTENT_TOPIC })

      await node.filter!.subscribe(decoder, (wakuMessage) => {
        if (!wakuMessage.payload) return
        const payload = decodePayload(wakuMessage.payload)
        // Anything that fails the contract is dropped: this is a public topic
        // and other applications may publish here too.
        if (!payload) return
        appendMessage({ ...payload, fromSelf: false })
      })
      if (cancelled) return

      const refreshPeers = async () => {
        const current = nodeRef.current
        if (!current || cancelled) return
        try {
          const peers = await current.getConnectedPeers()
          patch({
            peerCount: peers.length,
            peerIds: peers.map((peer) => peer.id.toString()),
          })
        } catch {
          // A transient failure to enumerate peers is not worth surfacing;
          // the next tick will pick it up.
        }
      }

      await refreshPeers()
      peerPoll = setInterval(refreshPeers, PEER_POLL_INTERVAL_MS)
      patch({ status: 'ready' })
    }

    run().catch((error: unknown) => {
      patch({
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      })
    })

    return () => {
      cancelled = true
      if (peerPoll) clearInterval(peerPoll)
      nodeRef.current = null
      encoderRef.current = null
      void node?.stop().catch(() => {
        // Nothing useful to do while unmounting.
      })
    }
  }, [appendMessage])

  const send = useCallback(
    async (nickname: string, text: string) => {
      const node = nodeRef.current
      const encoder = encoderRef.current
      if (!node || !encoder) throw new Error('The node is not connected yet.')
      if (isBlank(text)) return

      const payload = buildPayload(nickname, text)

      // Render immediately, then publish. Showing our own message only after
      // the network echoes it back would make the app feel broken.
      appendMessage({ ...payload, fromSelf: true })

      const result = await node.lightPush!.send(encoder, {
        payload: encodePayload(payload),
      })

      if (result.successes.length === 0) {
        const reason = result.failures?.[0]?.error
        throw new Error(
          reason ? `Could not publish: ${reason}` : 'Could not publish message.',
        )
      }
    },
    [appendMessage],
  )

  return { snapshot, messages, send }
}
