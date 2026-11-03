import { fileURLToPath } from 'node:url'

import sharp from 'sharp'
import { imageWidths } from '../app/[locale]/lambda-prize/_sections/image-assets'

const directory = new URL('../public/images/lambda-prize/v3/', import.meta.url)

for (const [name, widths] of Object.entries(imageWidths)) {
  const original = sharp(fileURLToPath(new URL(`${name}.png`, directory)))
  await original
    .clone()
    .webp({ quality: 90, effort: 6 })
    .toFile(fileURLToPath(new URL(`${name}.webp`, directory)))
  await Promise.all(
    widths.map(async (width) => {
      const image = original.clone().resize({ width, withoutEnlargement: true })
      await image
        .clone()
        .webp({ quality: 90, effort: 6 })
        .toFile(fileURLToPath(new URL(`${name}-${width}.webp`, directory)))
      await image
        .avif({ quality: 60, effort: 6 })
        .toFile(fileURLToPath(new URL(`${name}-${width}.avif`, directory)))
    })
  )
}
