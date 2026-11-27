import type { PgSelect } from 'drizzle-orm/pg-core'

import type { ListPage } from '@/contracts/pagination'

export function withPage<T extends PgSelect>(
  query: T,
  page: Readonly<Partial<ListPage>>
): T {
  if (page.limit !== undefined) query.limit(page.limit)
  if (page.offset !== undefined) query.offset(page.offset)
  return query
}
