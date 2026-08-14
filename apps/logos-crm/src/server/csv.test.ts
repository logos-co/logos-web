import { describe, expect, test } from 'vitest'

import { toCsv } from './csv'

describe('csv serialisation', () => {
  test('writes a header row from the keys', () => {
    const csv = toCsv([{ title: 'Case', owner: 'Mara Chen' }])

    expect(csv).toContain('title,owner')
    expect(csv).toContain('Case,Mara Chen')
  })

  test('starts with a BOM so spreadsheets read it as UTF-8', () => {
    // Without this, every non-ASCII name in the export is mangled on open.
    expect(toCsv([{ name: 'Amina Okafor' }])[0]).toBe('\uFEFF')
  })

  test('keeps non-ASCII names intact', () => {
    expect(toCsv([{ name: '오카포르' }])).toContain('오카포르')
  })

  test('neutralises a value a spreadsheet would run as a formula', () => {
    const csv = toCsv([{ note: '=HYPERLINK("http://evil.example")' }])

    expect(csv).toContain(`'=HYPERLINK`)
  })

  test('neutralises the other formula prefixes too', () => {
    const csv = toCsv([{ a: '+1', b: '-1', c: '@cmd' }])

    expect(csv).toContain(`'+1`)
    expect(csv).toContain(`'-1`)
    expect(csv).toContain(`'@cmd`)
  })

  test('leaves ordinary text alone', () => {
    expect(toCsv([{ note: 'Nothing to escape' }])).toContain(
      'Nothing to escape'
    )
  })

  test('quotes a value containing a comma', () => {
    expect(toCsv([{ note: 'one, two' }])).toContain('"one, two"')
  })
})
