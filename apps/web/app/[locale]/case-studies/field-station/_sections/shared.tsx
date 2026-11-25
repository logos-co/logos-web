import Image from 'next/image'
import { LogosMark, LogosWordmark } from '@acid-info/logos-ui'
import type { MediaRef } from '@repo/content/schemas'

export function Photo({
  image,
  className = '',
  preload = false,
  reveal = false,
}: {
  image: MediaRef
  className?: string
  preload?: boolean
  reveal?: boolean
}) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width ?? 1440}
      height={image.height ?? 900}
      sizes="(min-width: 768px) 50vw, 100vw"
      preload={preload}
      data-muster-reveal={reveal ? '' : undefined}
      className={`field-case-photo ${className}`}
    />
  )
}

export function BrandLockup() {
  return (
    <span className="field-case-brand" aria-label="Logos">
      <LogosMark size={30} />
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
