import type { ZineBlock, ZinePage as PageData } from '@repo/content/schemas'

interface ZinePageProps {
  slug: string
  page: PageData
  label: string
  highlights?: ReadonlyArray<{ start: number; end: number }>
  block?: ZineBlock
}

export function ZinePage({
  slug,
  page,
  label,
  highlights = [],
  block,
}: ZinePageProps) {
  const crop = block
    ? {
        x: Math.max(0, block.x - 4),
        y: Math.max(0, block.y - 4),
        width: Math.min(page.width - block.x + 4, block.width + 8),
        height: block.height + 8,
      }
    : { x: 0, y: 0, width: page.width, height: page.height }
  return (
    <figure
      className={`zine-page ${block ? 'zine-page-crop' : ''}`}
      aria-label={label}
      data-page={page.number}
    >
      <svg
        viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`}
        role="group"
        aria-label={label}
      >
        <image
          href={`/zines/generated/${slug}/${page.number}.webp`}
          width={page.width}
          height={page.height}
          aria-hidden="true"
        />
        {page.words.map(
          (word, index) =>
            highlights.some((hit) => index >= hit.start && index < hit.end) && (
              <rect
                key={index}
                x={word.x}
                y={word.y}
                width={word.width}
                height={word.height}
                className="zine-highlight"
              />
            )
        )}
        <text className="zine-word">
          {page.words.map(
            (word, index) =>
              (!block || (index >= block.start && index < block.end)) && (
                <tspan
                  key={index}
                  x={word.x}
                  y={word.y + word.height * 0.8}
                  fontSize={word.height}
                  textLength={word.width}
                  lengthAdjust="spacingAndGlyphs"
                  data-word={index}
                  data-page={page.number}
                >
                  {word.text}{' '}
                </tspan>
              )
          )}
        </text>
      </svg>
    </figure>
  )
}
