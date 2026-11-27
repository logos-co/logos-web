import { describe, expect, it } from 'vitest'

import { type ChatMessage, insertMessage, parsePayload } from '../waku'

const base = {
  v: 1,
  id: 'a',
  nickname: 'n',
  text: 'hi',
  sentAt: 1_700_000_000_000,
}

function message(
  id: string,
  receivedAt: number,
  sentAt = receivedAt,
): ChatMessage {
  return { ...base, v: 1, id, fromSelf: false, receivedAt, sentAt }
}

describe('parsePayload', () => {
  it('accepts a current timestamp', () => {
    expect(parsePayload({ ...base, sentAt: Date.now() })).not.toBeNull()
  })

  it.each([
    1e300,
    -1,
    1.5,
    Number.MAX_SAFE_INTEGER + 2,
    Date.now() + 2 * 86_400_000,
  ])('drops sentAt %s', (sentAt) => {
    expect(parsePayload({ ...base, sentAt })).toBeNull()
  })
})

describe('insertMessage', () => {
  it('does not let a future sentAt pin a message as newest', () => {
    const future = message('f', 1, Date.now() + 3_600_000)
    const list = insertMessage([future], message('b', 2))
    expect(list.map((m) => m.id)).toEqual(['f', 'b'])
  })

  it('orders a newest-first paged backlog and a live message', () => {
    const now = 10_000
    // Two store pages, newest page first, each oldest first within the page.
    const arrivals = [
      message('p2a', now, 300),
      message('p2b', now, 400),
      message('live', now, now),
      message('p1a', now + 1, 100),
      message('p1b', now + 1, 200),
    ]
    const list = arrivals.reduce<ChatMessage[]>(
      (list, m) => insertMessage(list, m),
      [],
    )
    expect(list.map((m) => m.id)).toEqual(['p1a', 'p1b', 'p2a', 'p2b', 'live'])
  })

  it('keeps the newest messages up to the limit', () => {
    let list: ChatMessage[] = []
    for (let i = 0; i < 5; i += 1)
      list = insertMessage(list, message(`m${i}`, i), 3)
    expect(list.map((m) => m.id)).toEqual(['m2', 'm3', 'm4'])
  })

  it('ignores a duplicate id', () => {
    const list = [message('a', 1)]
    expect(insertMessage(list, message('a', 2))).toBe(list)
  })
})
