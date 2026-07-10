import type { CSSProperties, HTMLAttributes } from 'react'

type MediaIconProps = Omit<HTMLAttributes<SVGSVGElement>, 'style'> & {
  size?: number
  style?: CSSProperties
}

export function MediaShareIcon({ size = 14, style, ...rest }: MediaIconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      style={{ ...style, width: size, height: size }}
      viewBox="0 0 14 14"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M10.5 9.38c-.443 0-.84.175-1.143.449L5.197 7.408c.03-.134.053-.268.053-.408s-.023-.274-.053-.408L9.31 4.194c.315.292.729.473 1.19.473a1.75 1.75 0 1 0-1.698-1.342L4.69 5.722A1.75 1.75 0 1 0 4.69 8.277l4.153 2.427a1.7 1.7 0 1 0 1.657-1.324Zm0-7.047a.583.583 0 1 1 0 1.167.583.583 0 0 1 0-1.167Zm-7 5.25a.583.583 0 1 1 0-1.166.583.583 0 0 1 0 1.166Zm7 4.095a.583.583 0 1 1 0-1.167.583.583 0 0 1 0 1.167Z"
        fill="currentColor"
      />
    </svg>
  )
}
