import assert from 'node:assert/strict'
import { it } from 'node:test'
import { startResourceTestCms } from './resource-test-cms'
import { BuilderResources } from '../BuilderResources'
import { CircleResources } from '../Circles'

function signal() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

it(
  'rejects the second writer before a shared resource edit and deletion can deadlock',
  { skip: !process.env.CMS_TEST_DATABASE_URL, timeout: 30000 },
  async (t) => {
    // Pause the winner inside its transaction, after the collection hooks ran.
    let pause: (() => Promise<void>) | undefined
    const payload = await startResourceTestCms(
      t,
      [BuilderResources, CircleResources].map((collection) => ({
        ...collection,
        lockDocuments: false,
        hooks: {
          ...collection.hooks,
          afterChange: [
            ...(collection.hooks?.afterChange ?? []),
            async () => {
              await pause?.()
            },
          ],
          beforeDelete: [
            ...(collection.hooks?.beforeDelete ?? []),
            async () => {
              await pause?.()
            },
          ],
        },
      }))
    )

    for (const collection of [
      'builder-resources',
      'circle-resources',
    ] as const) {
      for (const first of ['update', 'delete'] as const) {
        await t.test(`${collection}: ${first} first`, async () => {
          const doc = await payload.create({
            collection,
            data: {
              slug: 'resource',
              title: 'Original',
              description: 'Test resource',
              status: 'published',
              href: '/media',
              ctaLabel: 'Open',
            },
          })
          const update = () =>
            payload.update({
              collection,
              id: doc.id,
              data: { title: 'Edited' },
            })
          const remove = () => payload.delete({ collection, id: doc.id })
          const started = signal()
          const release = signal()
          pause = async () => {
            pause = undefined
            started.resolve()
            await release.promise
          }
          const winner = first === 'update' ? update() : remove()
          try {
            await Promise.race([started.promise, winner])
            await assert.rejects(first === 'update' ? remove() : update(), {
              status: 409,
            })
          } finally {
            release.resolve()
            await winner
            pause = undefined
          }
          const { docs } = await payload.find({ collection })
          assert.deepEqual(
            docs.map((row) => row.title),
            first === 'update' ? ['Edited'] : []
          )
          if (first === 'update') await remove()
        })
      }
    }
  }
)
