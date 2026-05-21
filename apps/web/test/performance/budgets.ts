export const performanceBudgets = {
  // Bumped 325k -> 430k to cover homepage growth from recent motion polish
  // and Get Started additions. Tighten this back down once homepage HTML is trimmed.
  maxHtmlBytes: 430_000,
  maxTotalTransferBytes: 12_500_000,
  maxImageBytes: 11_500_000,
  maxScriptBytes: 950_000,
  maxCssBytes: 150_000,
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
  '/press',
] as const
