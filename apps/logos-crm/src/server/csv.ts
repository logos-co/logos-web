import Papa from 'papaparse'

/**
 * A leading =, +, -, or @ makes a spreadsheet treat the cell as a formula, so a
 * value copied out of a CRM can execute when somebody opens the file. Prefixing
 * with an apostrophe keeps the text readable and inert.
 */
function neutraliseFormula(value: unknown): unknown {
  if (typeof value !== 'string') return value
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

/**
 * Serialises rows to CSV with a UTF-8 BOM.
 *
 * The BOM is what makes Excel read the file as UTF-8 rather than the local
 * codepage; without it, every non-ASCII name in the export is mangled.
 */
export function toCsv(rows: ReadonlyArray<Record<string, unknown>>): string {
  const safeRows = rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, neutraliseFormula(value)])
    )
  )

  return `\uFEFF${Papa.unparse(safeRows, { header: true })}`
}
