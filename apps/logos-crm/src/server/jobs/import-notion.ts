import { pool } from '@/server/db'
import { queryIntakeDatabase } from '@/server/notion-client'
import { getLastWatermark, importFromNotion } from '@/server/notion-import'

/**
 * Runs the Notion bridge import.
 *
 * A command rather than a screen: there is no admin UI yet, and the import is
 * something an operator runs deliberately and reads the counts of, not
 * something that should quietly happen on a schedule before anyone has
 * reconciled a single run.
 */
const since = await getLastWatermark()

const summary = await importFromNotion((cursor) =>
  queryIntakeDatabase({ since, cursor })
)

process.stdout.write(
  [
    `run        ${summary.runId}`,
    `created    ${summary.created}`,
    `duplicates ${summary.duplicates}`,
    `errors     ${summary.errors}`,
    `watermark  ${summary.watermark?.toISOString() ?? 'none'}`,
    '',
    summary.errors > 0
      ? 'Row errors are in crm_import_errors for this run id.'
      : '',
    '',
  ].join('\n')
)

await pool.end()
