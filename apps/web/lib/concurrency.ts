/**
 * Maps over items with at most `limit` tasks in flight, keeping input order.
 * Used where a burst of requests would trip the CMS.
 */
export async function mapWithConcurrency<T, R>(
  items: ReadonlyArray<T>,
  limit: number,
  task: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next
      next += 1
      results[index] = await task(items[index]!, index)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  )
  return results
}
