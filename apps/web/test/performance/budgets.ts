export const performanceBudgets = {
  maxHtmlBytes: 650_000,
  maxTotalTransferBytes: 18_750_000,
  maxImageBytes: 17_250_000,
  maxScriptBytes: 1_425_000,
  maxCssBytes: 225_000,
} as const

export const criticalRoutes = [
  '/',
  '/active-circles',
  '/builders-hub',
  '/builders-hub/rfps',
  '/builders-hub/ideas',
  '/circles',
  '/technology-stack',
  '/brand-kit',
  '/blog',
] as const
