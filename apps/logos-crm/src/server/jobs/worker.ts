import { run } from 'graphile-worker'

import { getServerEnv } from '@/server/env'

import { sendEmailNotification } from './send-email-notification'

/**
 * The worker process. Runs against the same PostgreSQL instance as the app —
 * no Redis, no hosted queue, no separate scheduler.
 *
 * Retries, backoff, and graceful shutdown belong to Graphile Worker; tasks
 * record their business outcome and rethrow rather than implementing a second
 * retry loop.
 */
const runner = await run({
  connectionString: getServerEnv().DATABASE_URL,
  concurrency: 4,
  taskList: {
    send_email_notification: sendEmailNotification,
  },
})

await runner.promise
