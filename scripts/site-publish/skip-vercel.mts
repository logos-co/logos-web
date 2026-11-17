import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Root directories of the Vercel projects linked to this repo.
export const vercelRootDirectories = [
  'apps/api',
  'apps/cms',
  'apps/logos-crm',
  'apps/logos-demos',
  'apps/web',
]

// Vercel deploys every pushed branch, including deploy-*, which only holds the
// static export. Without these files, each push clones the repo and fails in
// every project because its root directory is missing.
export const skipVercel = async (directory: string): Promise<void> => {
  for (const root of vercelRootDirectories) {
    await mkdir(resolve(directory, root), { recursive: true })
    await writeFile(
      resolve(directory, root, 'vercel.json'),
      JSON.stringify({ git: { deploymentEnabled: false } }) + '\n'
    )
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2]
  if (!directory) throw new Error('Usage: skip-vercel.mts <export directory>')
  await skipVercel(directory)
}
