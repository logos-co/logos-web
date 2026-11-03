import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const imageDirectory = new URL(
  '../public/images/developer-programmes/',
  import.meta.url
)

for (const name of ['rfp', 'prize', 'build']) {
  await Promise.all(
    [640, 1280, 1920, 2560].map(async (width) => {
      const image = sharp(
        fileURLToPath(new URL(`${name}.webp`, imageDirectory))
      ).resize({ width, withoutEnlargement: true })

      await image
        .clone()
        .webp({ quality: 90, effort: 6 })
        .toFile(fileURLToPath(new URL(`${name}-${width}.webp`, imageDirectory)))
      await image
        .avif({ quality: 60, effort: 6 })
        .toFile(fileURLToPath(new URL(`${name}-${width}.avif`, imageDirectory)))
    })
  )
}
