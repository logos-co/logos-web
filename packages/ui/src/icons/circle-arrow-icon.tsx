import type { CSSProperties, HTMLAttributes } from 'react'

type CircleArrowIconProps = Omit<HTMLAttributes<SVGSVGElement>, 'style'> & {
  /** Uniform pixel size (width = height). Default 30. */
  size?: number
  direction?: 'left' | 'right'
  style?: CSSProperties
}

export function CircleArrowIcon({
  size = 30,
  direction = 'left',
  className,
  style,
  ...rest
}: CircleArrowIconProps) {
  const svgStyle = {
    ...style,
    width: size,
    height: size,
    transform:
      direction === 'right'
        ? [style?.transform, 'rotate(180deg)'].filter(Boolean).join(' ')
        : style?.transform,
  } satisfies CSSProperties

  return (
    <svg
      aria-hidden="true"
      className={`inline-block shrink-0 ${className ?? ''}`}
      fill="none"
      style={svgStyle}
      viewBox="0 0 30 30"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <rect
        x="0.375"
        y="0.375"
        width="29.25"
        height="29.25"
        rx="14.625"
        stroke="currentColor"
        strokeWidth="0.75"
      />
      <path
        d="M23.7498 15H6.24976"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M14.9998 23.7499L6.24976 14.9999L14.9998 6.24994"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}
