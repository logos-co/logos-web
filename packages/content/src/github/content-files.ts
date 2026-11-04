import { getOctokit } from './client'
import { getGithubConfig } from './config'

async function getFile(path: string, ref: string) {
  const { owner, repo } = getGithubConfig()
  try {
    const { data } = await getOctokit().repos.getContent({
      owner,
      repo,
      path,
      ref,
    })
    if (Array.isArray(data) || data.type !== 'file')
      throw new Error(`Expected a file at ${path}`)
    return data
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 404)
      return null
    throw error
  }
}

export async function readContentJson(
  path: string,
  ref: string
): Promise<unknown> {
  const file = await getFile(path, ref)
  if (!file) return null
  if (file.encoding !== 'base64') throw new Error(`Cannot read JSON at ${path}`)
  return JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'))
}

export async function getFileBlobShas(paths: readonly string[], ref: string) {
  const { owner, repo } = getGithubConfig()
  const { data } = await getOctokit().git.getTree({
    owner,
    repo,
    tree_sha: ref,
    recursive: '1',
  })
  if (data.truncated)
    throw new Error('Cannot restore uploads from a partial base tree')
  const wanted = new Set(paths)
  const blobs = new Map<string, string>()
  for (const entry of data.tree) {
    if (!entry.path || !wanted.has(entry.path)) continue
    if (entry.mode !== '100644' || !entry.sha)
      throw new Error('The CMS can only restore regular uploads')
    blobs.set(entry.path, entry.sha)
  }
  return blobs
}
