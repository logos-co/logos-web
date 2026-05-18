import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export type RoutePerformanceMetrics = {
  cssBytes: number
  htmlBytes: number
  imageBytes: number
  route: string
  scriptBytes: number
  totalTransferBytes: number
}

export type PerformanceReport = {
  budgets: Record<string, number>
  generatedAt: string
  routes: RoutePerformanceMetrics[]
}

export const writePerformanceReport = (
  report: PerformanceReport,
  outputPath = join(process.cwd(), 'test-results/performance/latest.json')
): void => {
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(`${outputPath}.tmp`, `${JSON.stringify(report, null, 2)}\n`)
  renameSync(`${outputPath}.tmp`, outputPath)
}
