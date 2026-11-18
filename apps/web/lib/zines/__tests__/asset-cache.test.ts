import { describe, expect, it } from 'vitest'
import { zineCacheKey } from '../asset-cache'

describe('zineCacheKey', () => {
  it('ignores CRLF line endings in the text layer', () => {
    const source = new Uint8Array([1, 2, 3])
    expect(zineCacheKey(source, '{\r\n  "a": 1\r\n}\r\n')).toBe(
      zineCacheKey(source, '{\n  "a": 1\n}\n')
    )
  })

  it('changes when the text layer changes', () => {
    const source = new Uint8Array([1, 2, 3])
    expect(zineCacheKey(source, 'a')).not.toBe(zineCacheKey(source, 'b'))
  })
})
