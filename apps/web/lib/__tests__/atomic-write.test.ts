import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { writeFileAtomic } from '@/lib/atomic-write'

describe('writeFileAtomic', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'atomic-write-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('replaces the target and leaves no temp file', async () => {
    const target = join(dir, 'snapshot.json')
    await writeFile(target, 'old')

    await writeFileAtomic(target, 'new')

    expect(await readFile(target, 'utf8')).toBe('new')
    expect(await readdir(dir)).toEqual(['snapshot.json'])
  })

  it('keeps the old file and cleans up when the write fails', async () => {
    const target = join(dir, 'missing', 'snapshot.json')

    await expect(writeFileAtomic(target, 'new')).rejects.toThrow()
    expect(await readdir(dir)).toEqual([])
  })
})
