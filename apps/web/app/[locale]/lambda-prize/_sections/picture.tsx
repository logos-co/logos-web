import Image from 'next/image'
import type { MediaRef } from '@repo/content/schemas'
import { imageWidths } from './image-assets'

const bundledImages = new Map(
  Object.entries(imageWidths).map(([name, widths]) => [
    `/images/lambda-prize/v3/${name}.webp`,
    widths,
  ])
)

export function Picture({
  image,
  sizes,
  priority = false,
}: {
  image: MediaRef
  sizes: string
  priority?: boolean
}) {
  const fallback = (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      className="lp-image"
    />
  )
  const widths = bundledImages.get(image.src)
  if (!widths) return fallback
  const sourceSet = (format: string) =>
    widths
      .map(
        (width) =>
          `${image.src.replace('.webp', `-${width}.${format}`)} ${width}w`
      )
      .join(', ')
  return (
    <picture className="lp-picture">
      <source type="image/avif" srcSet={sourceSet('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={sourceSet('webp')} sizes={sizes} />
      {fallback}
    </picture>
  )
}
