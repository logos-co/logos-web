/**
 * Fixtures here are a real Logos Storage node's answers, not this code's.
 *
 * A node (logos-storage-nim v0.4.5, the published darwin-arm64 binary) was run
 * locally, each input below was uploaded to `POST /api/storage/v1/data`, and
 * the CID it printed was pasted in. So these tests fail if the implementation
 * drifts from the network, which a self-consistent test could never catch.
 *
 * The inputs are generated rather than stored, so the fixtures stay readable
 * and the repository stays small. Cases were chosen to cover the branches:
 * one block, an exact block boundary, and odd block counts, which are the
 * paths where the merkle key byte changes.
 */
import { describe, expect, it } from 'vitest'

import { BLOCK_SIZE, computeCid } from './storage-cid'

/**
 * Deterministic bytes, so the fixtures stay reproducible without storing
 * megabytes in the repository. xorshift32, because it stays exact in 32-bit
 * integer arithmetic. A multiplying generator would lose precision above
 * 2^53 and produce different bytes here than in the script that fed the node.
 */
function pseudoRandom(length: number, seed: number): Uint8Array {
  const out = new Uint8Array(length)
  let state = seed | 0
  for (let i = 0; i < length; i += 1) {
    state ^= state << 13
    state |= 0
    state ^= state >>> 17
    state ^= state << 5
    state |= 0
    out[i] = state & 0xff
  }
  return out
}

const text = (value: string) => new TextEncoder().encode(value)
const filled = (length: number, byte: string) =>
  new Uint8Array(length).fill(byte.charCodeAt(0))

describe('computeCid', () => {
  it('rejects an empty file, as the node does', async () => {
    await expect(computeCid(new Uint8Array(0))).rejects.toThrow(/empty/i)
  })

  it('pads a short file to a full block', async () => {
    // 11 bytes still hashes 64 KiB. Hashing only the 11 would give a wrong CID
    // with no error anywhere, so this is the case that pins the padding.
    const { cid, blockCount } = await computeCid(text('hello logos'))
    expect(blockCount).toBe(1)
    expect(cid).toBe('zDvZRwzm1XSHX9H19xAyPoetd9JwN4iKAmk5DKcMdu5wy9kNrYzj')
  })

  it('handles a single byte', async () => {
    const { cid } = await computeCid(text('x'))
    expect(cid).toBe('zDvZRwzm9WK2eFmmx8VaEF7jMTeZUoKgzA8Hg9iH5h7PJZ17ppRV')
  })

  it('handles an exact block boundary', async () => {
    const { cid, blockCount } = await computeCid(filled(BLOCK_SIZE, 'A'))
    expect(blockCount).toBe(1)
    expect(cid).toBe('zDvZRwzmAJ1jvRVL4Cxavh7HixYMrzgjpeuP731fzsz7G6Tip2qA')
  })

  it('carries the odd-layer key byte through three blocks', async () => {
    const { cid, blockCount } = await computeCid(pseudoRandom(131073, 3))
    expect(blockCount).toBe(3)
    expect(cid).toBe('zDvZRwzkzytTetSCjWgLWw4CjzySnZjpSvM99Km6qmzKCRWydAuy')
  })

  it('carries it again through five blocks', async () => {
    const { cid, blockCount } = await computeCid(pseudoRandom(294912, 5))
    expect(blockCount).toBe(5)
    expect(cid).toBe('zDvZRwzm6WtvQbKR1TuX7jmH6QnUH9fBQWc9bBmik4rHEaWnKauM')
  })

  it('handles seven blocks', async () => {
    const { cid, blockCount } = await computeCid(pseudoRandom(458752, 7))
    expect(blockCount).toBe(7)
    expect(cid).toBe('zDvZRwzkyQUdQxj3eb1cquyjukCB6NyNJv8owYvz9avov7T6dMWW')
  })

  it('changes the CID when the mimetype changes', async () => {
    const { cid } = await computeCid(text('hello logos'), {
      mimetype: 'text/plain',
    })
    expect(cid).toBe('zDvZRwzm2Exwm9TdmhF2tYFKvzfif1WcJZK1unDMKdB4181sQCpM')
  })

  it('changes the CID again when a filename is carried', async () => {
    const { cid } = await computeCid(text('hello logos'), {
      filename: 'hello.txt',
      mimetype: 'text/plain',
    })
    expect(cid).toBe('zDvZRwzm743Kf29EYEgKKT5kzfpDY3kZ61ryCMdLxrLyBN2ohaBD')
  })

  it('reports the tree separately from the manifest', async () => {
    const { treeCid, levels, blockCids } = await computeCid(text('hello logos'))
    expect(treeCid).toBe('zDzSvJTf2Nu9hwAzzj9aEQ61cHUWmmAJUeBSNK3vD1g1F1RERgze')
    expect(blockCids).toHaveLength(1)
    // A lone leaf is still compressed, so there is a level above it.
    expect(levels).toHaveLength(2)
    expect(levels[levels.length - 1]).toHaveLength(1)
  })
})
