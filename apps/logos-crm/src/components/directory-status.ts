import type { DirectoryStatus } from '@/contracts/directory'

/**
 * Display names for a person or organisation status.
 *
 * The stored values are lowercase identifiers. Some places set them in small
 * capitals through the stylesheet, and the rest were printing the identifier
 * as-is, which read like a value that had not been finished.
 */
export const directoryStatusLabels: Record<DirectoryStatus, string> = {
  prospect: 'Prospect',
  active: 'Active',
  inactive: 'Inactive',
}
