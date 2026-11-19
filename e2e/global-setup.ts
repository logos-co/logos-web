import { LOGOS_WEB_URL, siteEnvironment } from './src/config/site'
import { assertTargetsAnswer } from './src/helpers/target-check'

/**
 * Stop before the first test when a deployed site does not answer. A local
 * target is skipped: a server that is not running refuses the connection, and
 * each test fails on that at once.
 */
export default async function globalSetup(): Promise<void> {
  if (siteEnvironment(LOGOS_WEB_URL) === 'local') return
  await assertTargetsAnswer([LOGOS_WEB_URL])
}
