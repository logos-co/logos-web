import { runMigrations } from 'graphile-worker'

import { getServerEnv } from '@/server/env'

/**
 * Installs the queue's own schema.
 *
 * Run as part of `db:migrate` rather than at worker startup, because the web
 * process enqueues jobs transactionally through `graphile_worker.add_job`: if
 * the schema only appeared when a worker first booted, writing a note would
 * fail on a fresh database until someone started the worker.
 */
await runMigrations({ connectionString: getServerEnv().DATABASE_URL })
