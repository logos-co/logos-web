import type { ZineBlock, ZinePage as PageData } from '@repo/content/schemas'

interface ZinePageProps {
  slug: string
  page: PageData
  label: string
  highlights?: ReadonlyArray<{ start: number; end: number }>
  block?: ZineBlock
  onSelectBlock?: (index: number) => void
}

export function ZinePage({
  slug,
  page,
  label,
  highlights = [],
  block,
  onSelectBlock,
}: ZinePageProps) {
  const crop = block
    ? {
        x: Math.max(0, block.x - 2),
        y: Math.max(0, block.y - 4),
        width: Math.min(page.width - block.x + 2, block.width + 4),
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
        className={onSelectBlock ? 'cursor-pointer' : undefined}
        onClick={
          onSelectBlock
            ? (event) => {
                if (window.getSelection()?.toString()) return
                const matrix = event.currentTarget.getScreenCTM()
                if (!matrix) return
                const point = new DOMPoint(
                  event.clientX,
                  event.clientY
                ).matrixTransform(matrix.inverse())
                const index = page.blocks.findIndex(
                  (item) =>
                    point.x >= item.x &&
                    point.x <= item.x + item.width &&
                    point.y >= item.y &&
                    point.y <= item.y + item.height
                )
                if (index >= 0) onSelectBlock(index)
              }
            : undefined
        }
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
        {(page.links ?? [])
          .filter(
            (link) =>
              link.x < crop.x + crop.width &&
              link.x + link.width > crop.x &&
              link.y < crop.y + crop.height &&
              link.y + link.height > crop.y
          )
          .map((link, index) => (
            <a
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.href}
              className="zine-document-link cursor-pointer"
              onClick={(event) => event.stopPropagation()}
            >
              <rect
                x={link.x}
                y={link.y}
                width={link.width}
                height={link.height}
                fill="transparent"
              />
            </a>
          ))}
      </svg>
    </figure>
  )
}
