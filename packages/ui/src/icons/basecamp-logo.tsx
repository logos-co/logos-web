/**
 * Basecamp app logo: the ⛺ emoji on a dark hexagon badge, matching the
 * icon in the Basecamp desktop app.
 *
 * The badge proportions (106×92) and the emoji size and position were
 * measured from the app. `size` sets the width in px; the height follows
 * the badge's aspect ratio.
 */
import type { CSSProperties, HTMLAttributes } from 'react'

const BADGE_WIDTH = 106
const BADGE_HEIGHT = 92
// Inset by 2 units and stroked at 4 so the corners are slightly rounded
// while the outer edge still fills the 106×92 box.
const BADGE_PATH = 'M40 2H66L104 68L92 90H14L2 68Z'
const BADGE_STROKE_WIDTH = 4
const DEFAULT_BADGE_COLOR = '#141414'
const DEFAULT_SIZE = 52
// The emoji glyph spans about 40% of the badge width in the app.
const EMOJI_FONT_SCALE = 0.41
// The tent sits slightly below the badge's vertical centre.
const EMOJI_OFFSET_Y = '3%'
const TENT_EMOJI = '⛺️'

type BasecampLogoProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  /** Width in px. Height is derived from the badge aspect ratio. Default 52. */
  size?: number
  /** Fill of the hexagon behind the tent. Defaults to the app's #141414. */
  badgeColor?: string
}

export function BasecampLogo({
  size = DEFAULT_SIZE,
  badgeColor = DEFAULT_BADGE_COLOR,
  className,
  style,
  ...rest
}: BasecampLogoProps) {
  const rootStyle = {
    ...style,
    position: 'relative',
    display: 'inline-grid',
    placeItems: 'center',
    width: size,
    height: (size * BADGE_HEIGHT) / BADGE_WIDTH,
    flexShrink: 0,
  } satisfies CSSProperties

  const emojiStyle = {
    position: 'relative',
    fontSize: size * EMOJI_FONT_SCALE,
    lineHeight: 1,
    transform: `translateY(${EMOJI_OFFSET_Y})`,
    fontFamily:
      '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
  } satisfies CSSProperties

  return (
    <span aria-hidden="true" className={className} style={rootStyle} {...rest}>
      <svg
        viewBox={`0 0 ${BADGE_WIDTH} ${BADGE_HEIGHT}`}
        fill="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <path
          d={BADGE_PATH}
          fill={badgeColor}
          stroke={badgeColor}
          strokeWidth={BADGE_STROKE_WIDTH}
          strokeLinejoin="round"
        />
      </svg>
      <span style={emojiStyle}>{TENT_EMOJI}</span>
    </span>
  )
}
