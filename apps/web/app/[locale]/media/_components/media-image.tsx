import { preload } from 'react-dom'

import type { BlogImage } from '@/lib/blog-content'

interface MediaImageProps {
  image: BlogImage
  /** Rendered width hints for the browser, as in the `sizes` attribute. */
  sizes: string
  className?: string
  /** Above-the-fold image: preload it and fetch it first. */
  priority?: boolean
}

/**
 * next/image cannot add a srcset in the static export, so the resized copies
 * from lib/media-images are wired up by hand. Without them this is a plain
 * CMS image.
 */
export function MediaImage({
  image,
  sizes,
  className,
  priority = false,
}: MediaImageProps) {
  const imageSizes = image.srcSet ? sizes : undefined

  if (priority) {
    preload(image.url, {
      as: 'image',
      imageSrcSet: image.srcSet,
      imageSizes,
      fetchPriority: 'high',
    })
  }

  return (
    <img
      src={image.url}
      srcSet={image.srcSet}
      sizes={imageSizes}
      alt={image.alt}
      width={image.width || undefined}
      height={image.height || undefined}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={className}
    />
  )
}
