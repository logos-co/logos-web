import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

/**
 * Resets the Scout fixtures before the suite.
 *
 * Reviewing a candidate changes its state and discovery consumes the
 * catalogue, so these tests would otherwise pass once and then fail against
 * the queue they themselves left behind. The coordinator tests create their
 * own records through the intake endpoint; Scout has no candidate-creation
 * endpoint by design, so the fixtures are reset here instead.
 */
export default async function globalSetup(): Promise<void> {
  await run('pnpm', ['db:reset-scout'], {
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgresql://logos:logos@localhost:5434/logos_crm',
    },
  })
}
