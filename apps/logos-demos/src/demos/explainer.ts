import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Reads a demo's explainer markdown at build time.
 *
 * Server-only: the app is a static export, so this runs during `next build`
 * and the markdown ships as part of the prerendered page rather than being
 * fetched. Keeping the explainer as a real `.md` file means it stays editable
 * as markdown instead of as an escaped string in a module.
 */
export function readExplainer(demo: string): string {
  return readFileSync(
    join(process.cwd(), 'src', 'demos', demo, 'how-it-works.md'),
    'utf8',
  )
}
