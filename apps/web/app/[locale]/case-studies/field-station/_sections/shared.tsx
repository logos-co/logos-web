import Image from 'next/image'
import { LogosMark, LogosWordmark } from '@acid-info/logos-ui'
import type { MediaRef } from '@repo/content/schemas'

import imageSourceManifest from './image-sources.json'

const imageSources: Partial<Record<string, string>> = imageSourceManifest

export function Photo({
  image,
  className = '',
  preload = false,
  reveal = false,
  fullWidth = false,
  eager = false,
  desktopSrc,
  sizes: sizesOverride,
}: {
  image: MediaRef
  className?: string
  preload?: boolean
  reveal?: boolean
  fullWidth?: boolean
  eager?: boolean
  desktopSrc?: string
  sizes?: string
}) {
  const width = image.width ?? 1440
  const sizes =
    sizesOverride ?? (fullWidth ? '100vw' : '(min-width: 768px) 50vw, 100vw')
  const srcSet = imageSources[image.src]
  return (
    <picture className="field-case-picture">
      {desktopSrc && (
        <source
          media="(min-width: 768px)"
          srcSet={imageSources[desktopSrc] ?? desktopSrc}
          sizes={sizes}
        />
      )}
      {srcSet && <source srcSet={srcSet} sizes={sizes} />}
      <Image
        src={image.src}
        alt={image.alt}
        width={width}
        height={image.height ?? 900}
        sizes={sizes}
        loading={preload || eager ? 'eager' : 'lazy'}
        fetchPriority={preload ? 'high' : undefined}
        data-muster-reveal={reveal ? '' : undefined}
        className={`field-case-photo ${className}`}
      />
    </picture>
  )
}

export function BrandLockup() {
  return (
    <span className="field-case-brand" aria-label="Logos">
      <LogosMark size={18.8} />
      <LogosWordmark />
    </span>
  )
}

export function Paragraphs({ body }: { body: readonly string[] }) {
  return (
    <div className="field-case-paragraphs">
      {body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  )
}
