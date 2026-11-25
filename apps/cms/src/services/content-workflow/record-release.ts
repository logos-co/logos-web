import type { Payload } from 'payload'

/**
 * Marks every merged change request that production has not received yet.
 * A release PR merged on GitHub is not recorded here, so `promotedBy` only
 * covers fast-forwards made from the CMS.
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
