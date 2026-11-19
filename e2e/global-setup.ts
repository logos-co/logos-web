import {
  BYPASS_HEADER,
  BYPASS_TOKEN,
  LOGOS_WEB_URL,
  siteEnvironment,
} from './src/config/site'
import { assertTargetsAnswer } from './src/helpers/target-check'

/**
 * Stop before the first test when a deployed site does not answer. A local
 * target is skipped: a server that is not running refuses the connection, and
 * each test fails on that at once.
 */
export default async function globalSetup(): Promise<void> {
  if (siteEnvironment(LOGOS_WEB_URL) === 'local') return
  // The only target is the site under test, so the token stays on its origin.
  await assertTargetsAnswer(
    [LOGOS_WEB_URL],
    (): Record<string, string> =>
      BYPASS_TOKEN ? { [BYPASS_HEADER]: BYPASS_TOKEN } : {}
  )
}
