'use client'

import { useEffect, useRef, useState } from 'react'

import { NetworkStatus } from '@/components/network-status'
import { useWakuNode } from '@/components/use-waku-node'
import { CONTENT_TOPIC, formatTime, isBlank } from '@/lib/waku'

export function ChatRoom() {
  const { snapshot, messages, send } = useWakuNode()
  const [nickname, setNickname] = useState('')
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const feedEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isReady = snapshot.status === 'ready'
  const canSend = isReady && !isSending && !isBlank(draft)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSend) return

    setIsSending(true)
    setSendError(null)
    const pending = draft
    setDraft('')

    try {
      await send(nickname, pending)
    } catch (error) {
      // Put the text back so the message is not silently lost.
      setDraft(pending)
      setSendError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <section className="flex min-h-[520px] flex-col rounded-lg border border-[var(--color-gray-01)] bg-[var(--color-white)]">
        <div className="flex-1 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <p className="pt-16 text-center text-sm text-[var(--color-gray-04)]">
              {isReady
                ? 'No messages yet. Say something — or open this page in a second tab and watch it arrive over the network.'
                : 'Connecting this browser to the Waku network…'}
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={
                    message.fromSelf ? 'flex flex-col items-end' : 'flex flex-col'
                  }
                >
                  <div className="flex items-baseline gap-2 text-[12px] text-[var(--color-gray-05)]">
                    <span className="font-medium text-[var(--color-gray-06)]">
                      {message.fromSelf ? 'You' : message.nickname}
                    </span>
                    <time dateTime={new Date(message.sentAt).toISOString()}>
                      {formatTime(message.sentAt)}
                    </time>
                  </div>
                  <p
                    className={`mt-1 max-w-[46ch] rounded-lg px-3.5 py-2.5 text-[15px] whitespace-pre-wrap ${
                      message.fromSelf
                        ? 'bg-[var(--color-brand-dark-green)] text-[var(--color-brand-off-white)]'
                        : 'bg-[var(--color-brand-off-white)] text-[var(--color-brand-dark-green)]'
                    }`}
                  >
                    {message.text}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div ref={feedEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 border-t border-[var(--color-gray-01)] p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="Your name"
              maxLength={32}
              aria-label="Your name"
              className="w-full rounded border border-[var(--color-gray-01)] px-3 py-2.5 text-[15px] sm:w-40"
            />
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                isReady ? 'Write a message' : 'Waiting for the network…'
              }
              maxLength={512}
              disabled={!isReady}
              aria-label="Message"
              className="flex-1 rounded border border-[var(--color-gray-01)] px-3 py-2.5 text-[15px] disabled:bg-[var(--color-brand-off-white)] disabled:text-[var(--color-gray-04)]"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="rounded bg-[var(--color-brand-dark-green)] px-5 py-2.5 text-[15px] font-medium text-[var(--color-brand-off-white)] disabled:bg-[var(--color-gray-02)]"
            >
              {isSending ? 'Sending…' : 'Send'}
            </button>
          </div>

          {sendError && (
            <p role="alert" className="text-[13px] text-[var(--color-accent-purple)]">
              {sendError}
            </p>
          )}

          <p className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-gray-04)]">
            {CONTENT_TOPIC}
          </p>
        </form>
      </section>

      <NetworkStatus snapshot={snapshot} />
    </div>
  )
}
