import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { getAllBlogArticles, getAllBlogPodcasts } from '../lib/blog-content'
import { env } from '../lib/env'
import type { PressSnapshot } from '../lib/press-snapshot'

if (env.PRESS_CONTENT_SNAPSHOT) {
  throw new Error(
    'Capture must read current Strapi content, not an existing snapshot'
  )
}
const [articles, podcasts] = await Promise.all([
  getAllBlogArticles(),
  getAllBlogPodcasts(),
])
const snapshot: PressSnapshot = { version: 1, articles, podcasts }
await writeFile(resolve('../../press-snapshot.json'), JSON.stringify(snapshot))
