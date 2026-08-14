import { describe, expect, test } from 'vitest'

import {
  buildExcerpt,
  NOTIFICATION_EXCERPT_LENGTH,
  parseMentionHandles,
} from './mention'

describe('mention parsing', () => {
  test('finds a dotted handle', () => {
    expect(parseMentionHandles('Can @mara.chen take this one?')).toEqual([
      'mara.chen',
    ])
  })

  test('finds a full email address', () => {
    expect(parseMentionHandles('cc @jon.bell@logos.co please')).toEqual([
      'jon.bell@logos.co',
    ])
  })

  test('finds a mention at the very start of a note', () => {
    expect(parseMentionHandles('@mara.chen see below')).toEqual(['mara.chen'])
  })

  test('drops sentence punctuation from the handle', () => {
    expect(parseMentionHandles('Handing to @jon.bell.')).toEqual(['jon.bell'])
    expect(parseMentionHandles('Ask (@mara.chen), then me')).toEqual([
      'mara.chen',
    ])
  })

  test('lowercases so casing does not create a second mention', () => {
    expect(parseMentionHandles('@Mara.Chen and @mara.chen')).toEqual([
      'mara.chen',
    ])
  })

  test('deduplicates repeated mentions of the same person', () => {
    expect(parseMentionHandles('@jon.bell @jon.bell @jon.bell')).toEqual([
      'jon.bell',
    ])
  })

  test('ignores an email address that is not a mention', () => {
    // Nobody was mentioned here - the address is the subject of the note.
    expect(parseMentionHandles('Their contact is amina@example.org')).toEqual(
      []
    )
  })

  test('returns nothing for a note without mentions', () => {
    expect(parseMentionHandles('Reviewed the proposal, looks solid.')).toEqual(
      []
    )
  })
})

describe('notification excerpt', () => {
  test('collapses whitespace so the preview stays on one line', () => {
    expect(buildExcerpt('Spoke\n\nwith   them today')).toBe(
      'Spoke with them today'
    )
  })

  test('truncates a long note', () => {
    const excerpt = buildExcerpt('x'.repeat(500))

    expect(excerpt).toHaveLength(NOTIFICATION_EXCERPT_LENGTH)
    expect(excerpt.endsWith('…')).toBe(true)
  })

  test('leaves a short note intact', () => {
    expect(buildExcerpt('Short note.')).toBe('Short note.')
  })
})
