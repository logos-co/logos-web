export const performanceBudgets = {
  maxHtmlBytes: 325_000,
  maxTotalTransferBytes: 12_500_000,
  maxImageBytes: 11_500_000,
  maxScriptBytes: 950_000,
  maxCssBytes: 150_000,
} as const

export const criticalRoutes = [
  '/',
  '/about',
  '/active-circles',
  '/builders-hub',
  '/builders-hub/rfps',
  '/builders-hub/ideas',
  '/circles',
  '/technology-stack',
  '/brand-kit',
  '/press',
] as const
