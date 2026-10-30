export async function submitExhibit(values) {
  const response = await fetch(import.meta.env.MUSEUM_SUBMISSION_ENDPOINT, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
    signal: AbortSignal.timeout(20_000),
  })
  if (response.status === 429) {
    throw new Error('Too many submissions. Please try again in 15 minutes.')
  }
  const result = await response.json().catch(() => null)
  if (!response.ok || result?.success !== true) {
    throw new Error(
      'We could not send your submission. Your answers have been kept. Please try again later.'
    )
  }
}
