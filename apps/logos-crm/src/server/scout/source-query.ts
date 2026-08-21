const ignoredTerms = new Set([
  'active',
  'and',
  'for',
  'from',
  'organisation',
  'organisations',
  'organization',
  'organizations',
  'project',
  'projects',
  'source',
  'the',
  'with',
  'work',
])

/** Turns a broad brief into a small number of source-native topic searches. */
export function sourceSearchTerms(query: string): string[] {
  const terms = query
    .toLocaleLowerCase('en')
    .split(/\s+/)
    .map((term) => term.replace(/[^a-z0-9-]/g, ''))
    .filter((term) => term.length >= 3 && !ignoredTerms.has(term))

  return [...new Set(terms)].slice(0, 2)
}
