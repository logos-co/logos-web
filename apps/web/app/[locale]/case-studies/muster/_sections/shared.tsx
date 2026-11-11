import Image from 'next/image'
import { LogosMark, LogosWordmark } from '@acid-info/logos-ui'

export const assetPath = '/images/muster'

export function Paragraphs({ body }: { body: readonly string[] }) {
  return (
    <div className="muster-paragraphs">
      {body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  )
}

export function LogosLockup({
  brand,
  size = 32,
}: {
  brand: string
  size?: number
}) {
  return (
    <span className="muster-logos">
      <span className="sr-only">{brand}</span>
      <LogosMark size={size} />
      <LogosWordmark />
    </span>
  )
}

export function MusterLockup({
  project,
  light = false,
}: {
  project: string
  light?: boolean
}) {
  const size = light ? 24 : 20
  return (
    <span className="muster-lockup">
      <Image
        src={`${assetPath}/muster-mark-${light ? 'light' : 'dark'}.svg`}
        width={size}
        height={size}
        alt=""
      />
      {project}
    </span>
  )
}
