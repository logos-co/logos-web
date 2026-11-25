import Image from 'next/image'
import { LogosMark, LogosWordmark } from '@acid-info/logos-ui'
import type { MediaRef } from '@repo/content/schemas'

export function Photo({
  image,
  className = '',
  preload = false,
  reveal = false,
  fullWidth = false,
  eager = false,
}: {
  image: MediaRef
  className?: string
  preload?: boolean
  reveal?: boolean
  fullWidth?: boolean
  eager?: boolean
}) {
  const width = image.width ?? 1440
  const sizes = fullWidth ? '100vw' : '(min-width: 768px) 50vw, 100vw'
  const hasVariants =
    /^\/images\/field-station-case-study\/(cover-1200|intro-896|basics-896|community-4000|community2-4000|projects-2622|testimonial-4000|build-1404)\.webp$/.test(
      image.src
    )
  const srcSet = [640, 1280, width]
    .filter(
      (size, index, sizes) => size <= width && sizes.indexOf(size) === index
    )
    .map(
      (size) => `${image.src.replace(/-\d+\.webp$/, `-${size}.webp`)} ${size}w`
    )
    .join(', ')
  return (
    <picture className="field-case-picture">
      {hasVariants && (
        <source type="image/webp" srcSet={srcSet} sizes={sizes} />
      )}
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
