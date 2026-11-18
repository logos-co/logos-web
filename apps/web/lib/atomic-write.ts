import { rm, rename, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

/**
 * Writes through a temp file in the same directory, then renames it over the
 * target, so a build step killed mid-write never leaves a truncated file.
 */
export const writeFileAtomic = async (
  path: string,
  data: string
): Promise<void> => {
  const temp = join(
    dirname(path),
    `.${basename(path)}.${process.pid}.${Date.now()}.tmp`
  )
  try {
    await writeFile(temp, data)
    await rename(temp, path)
  } catch (error) {
    await rm(temp, { force: true })
    throw error
  }
}
