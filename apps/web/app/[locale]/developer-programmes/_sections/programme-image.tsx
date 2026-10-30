import Image from 'next/image'

const responsiveImages = new Set([
  '/images/developer-programmes/rfp.webp',
  '/images/developer-programmes/prize.webp',
  '/images/developer-programmes/build.webp',
])

interface ProgrammeImageProps {
  src: string
  alt: string
  sizes: string
  eager?: boolean
}

export function ProgrammeImage({
  src,
  alt,
  sizes,
  eager = false,
}: ProgrammeImageProps) {
  const optimised = responsiveImages.has(src)
  const stem = src.replace(/\.webp$/, '')

  return (
    <picture>
      {optimised && (
        <>
          {['avif', 'webp'].map((format) => (
            <source
              key={format}
              type={`image/${format}`}
              sizes={sizes}
              srcSet={[640, 1280, 1920, 2560]
                .map((width) => `${stem}-${width}.${format} ${width}w`)
                .join(', ')}
            />
          ))}
        </>
      )}
      <Image
        src={optimised ? `${stem}-2560.webp` : src}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
      />
    </picture>
  )
}
