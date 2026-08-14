import type { Task } from 'graphile-worker'
import { z } from 'zod/v4'

import { expireExports, generateExport } from '@/server/export-repository'

const payloadSchema = z.object({ exportId: z.string().uuid() })

export const generateExportTask: Task = async (rawPayload, helpers) => {
  const { exportId } = payloadSchema.parse(rawPayload)
  const rows = await generateExport(exportId)
  helpers.logger.info(`Export ${exportId} wrote ${rows} rows.`)
}

/**
 * Deletes expired export files. Scheduled rather than triggered on download,
 * because a file nobody downloads is exactly the one that must not linger.
 */
export const expireExportsTask: Task = async (_payload, helpers) => {
  const expired = await expireExports(`job:${helpers.job.id}`)
  if (expired > 0) helpers.logger.info(`Expired ${expired} exports.`)
}
