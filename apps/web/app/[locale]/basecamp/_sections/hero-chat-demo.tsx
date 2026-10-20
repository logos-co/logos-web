'use client'

import { useEffect, useState } from 'react'
import type { Renewal } from './atoms'

interface HeroChatDemoProps {
  copy: Renewal['hero']['chatDemo']
  description: string
  details: string[]
}

export function HeroChatDemo({
  copy,
  description,
  details,
}: HeroChatDemoProps) {
  const [frame, setFrame] = useState(0)
  const sentAt = copy.draft.length + 8
  const replyAt = sentAt + 8
  const cycleLength = replyAt + 32

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFrame(replyAt)
      return
    }
    const interval = window.setInterval(
      () => setFrame((current) => (current + 1) % cycleLength),
      120
    )
    return () => window.clearInterval(interval)
  }, [cycleLength, replyAt])

  const sent = frame >= sentAt
  const replied = frame >= replyAt
  const draft = sent ? details[3] : copy.draft.slice(0, frame)

  return (
    <div className="bc-chat-demo">
      <div className="bc-chat-sessions">
        <div className="bc-chat-new">{copy.newChatLabel}</div>
        <small>{details[0]}</small>
        <div className="bc-chat-session is-active">
          <strong>{details[1]}</strong>
          <span>{copy.sessionPreview}</span>
        </div>
        <div className="bc-chat-session">
          <strong>{copy.otherSession}</strong>
          <span>{details[2]}</span>
        </div>
        <div className="bc-chat-identity">
          <strong>{copy.identity}</strong>
          <span>{description}</span>
        </div>
      </div>
      <div className="bc-chat-thread">
        <strong>{details[1]}</strong>
        <div className="bc-chat-messages">
          <span>{copy.firstMessage}</span>
          <span className="is-outgoing">{copy.secondMessage}</span>
          {sent && <span className="is-outgoing">{copy.draft}</span>}
          {replied && <span>{copy.reply}</span>}
        </div>
        <div className="bc-chat-input">{draft}</div>
      </div>
    </div>
  )
}
