'use client'

import { Button } from '@acid-info/logos-ui'
import { useEffect, useRef, useState } from 'react'

import { NetworkStatus } from '@/components/network-status'
import { useWakuNode } from '@/components/use-waku-node'
import { CONTENT_TOPIC, formatTime, isBlank } from '@/lib/waku'

const INPUT_CLASS =
  'text-body-sans border border-gray-01 bg-white px-3 py-2.5 text-brand-dark-green placeholder:text-gray-04'

function EmptyState({
  isReady,
  isLoadingHistory,
}: {
  isReady: boolean
  isLoadingHistory: boolean
}) {
  if (!isReady) {
    return 'Connecting this browser to the Waku network…'
  }
  if (isLoadingHistory) {
    return 'Asking store nodes for earlier messages…'
  }
  return 'No messages yet. Say something — or open this page in a second tab and watch it arrive over the network.'
}

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
      <section className="flex min-h-[520px] flex-col border border-gray-01 bg-white">
        <div className="flex-1 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <p className="text-body-sans pt-16 text-center text-gray-04">
              <EmptyState
                isReady={isReady}
                isLoadingHistory={snapshot.isLoadingHistory}
              />
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={`flex flex-col ${message.fromSelf ? 'items-end' : ''}`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-caption-sans text-gray-06">
                      {message.fromSelf ? 'You' : message.nickname}
                    </span>
                    <time
                      dateTime={new Date(message.sentAt).toISOString()}
                      className="text-mono-s text-gray-04"
                    >
                      {formatTime(message.sentAt)}
                    </time>
                  </div>
                  <p
                    className={`text-body-sans mt-1 max-w-[46ch] px-3.5 py-2.5 whitespace-pre-wrap ${
                      message.fromSelf
                        ? 'bg-brand-dark-green text-brand-off-white'
                        : 'bg-brand-off-white text-brand-dark-green'
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
          className="flex flex-col gap-3 border-t border-gray-01 p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="Your name"
              maxLength={32}
              aria-label="Your name"
              className={`${INPUT_CLASS} w-full sm:w-40`}
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
              className={`${INPUT_CLASS} flex-1 disabled:bg-brand-off-white disabled:text-gray-04`}
            />
            <Button
              type="submit"
              variant="primary"
              icon={false}
              disabled={!canSend}
              className="cursor-pointer"
            >
              {isSending ? 'Sending' : 'Send'}
            </Button>
          </div>

          {sendError && (
            <p role="alert" className="text-caption-sans text-accent-purple">
              {sendError}
            </p>
          )}

          <p className="text-mono-s text-gray-04">{CONTENT_TOPIC}</p>
        </form>
      </section>

      <NetworkStatus snapshot={snapshot} />
    </div>
  )
}
