import { run } from 'graphile-worker'

import { getServerEnv } from '@/server/env'

import { expireIntakePayloadsTask } from './expire-intake-payloads'
import { expireExportsTask, generateExportTask } from './generate-export'
import { sendEmailNotification } from './send-email-notification'
import { sendTaskRemindersTask } from './send-task-reminders'

/**
 * The worker process. Runs against the same PostgreSQL instance as the app -
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
    expire_intake_payloads: expireIntakePayloadsTask,
    generate_export: generateExportTask,
    expire_exports: expireExportsTask,
    send_task_reminders: sendTaskRemindersTask,
  },
  // Graphile Worker's own cron: no second scheduler and no cron container.
  crontab: [
    '0 3 * * * expire_intake_payloads',
    '30 * * * * expire_exports',
    '0 8 * * * send_task_reminders',
  ].join('\n'),
})

await runner.promise
