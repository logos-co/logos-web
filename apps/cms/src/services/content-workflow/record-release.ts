import type { Payload } from 'payload'

/**
 * Marks every merged change request that production has not received yet.
 * Called after every fast-forward made from the CMS, including an approved
 * release PR; a push to `master` made outside the CMS is not recorded.
 */
export const recordPromotion = async ({
  payload,
  userId,
}: {
  payload: Payload
  userId: number
}): Promise<void> => {
  await payload.update({
    collection: 'content-change-requests',
    where: {
      status: { equals: 'merged' },
      promotedAt: { exists: false },
    },
    data: { promotedBy: userId, promotedAt: new Date().toISOString() },
  })
}

/** Marks every promoted change request that no live publish has shipped yet. */
export const recordProductionPublish = async ({
  payload,
  userId,
}: {
  payload: Payload
  userId: number
}): Promise<void> => {
  await payload.update({
    collection: 'content-change-requests',
    where: {
      status: { equals: 'merged' },
      promotedAt: { exists: true },
      publishedAt: { exists: false },
    },
    data: { publishedBy: userId, publishedAt: new Date().toISOString() },
  })
}
