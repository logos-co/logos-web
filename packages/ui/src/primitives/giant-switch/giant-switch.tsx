/**
 * @figma-path   Logos App / Giant Switch
 * @figma-node   1972:22168 (variants frame) ·
 *               Desktop: 1972:22178 (Def1 grey) · 1972:22169 (Def3 yellow)
 *               Mobile:  2095:22942 (Def1 mobile)
 *
 * Oversized banner primitive — ONE rounded panel with an image disc + content.
 *
 * Desktop (md+): side-by-side — image disc absolutely positioned on one side,
 *   content block absolutely positioned on the other. panel h=590, rounded-200.
 * Mobile (< md): stacked — image on top, centered content below.
 *   panel h=828, rounded-100, w≈393.
 *
 *   <GiantSwitch
 *     accent="grey"
 *     imagePosition="left"            // desktop only; mobile always stacks
 *     image={<Image fill ... />}
 *     title="Install the Logos app."
 *     description="..."
 *     tags={<><GiantSwitchTag icon={...}>Wallet</GiantSwitchTag>…</>}
 *     actions={<><Button …>Install</Button><Button …>Learn more</Button></>}
 *   />
 */
import type { ReactNode } from 'react'

export type GiantSwitchAccent = 'grey' | 'yellow'
export type GiantSwitchImagePosition = 'left' | 'right'

type GiantSwitchProps = {
  accent?: GiantSwitchAccent
  /** Desktop only — which side the image disc sits on. Mobile always stacks. */
  imagePosition?: GiantSwitchImagePosition
  /** Desktop only — shifts the image/content when the install trigger is hovered. */
  installHoverShift?: boolean
  image: ReactNode
  title: ReactNode
  description?: ReactNode
  tags?: ReactNode
  actions?: ReactNode
  className?: string
}

const accentBg: Record<GiantSwitchAccent, string> = {
  grey: 'bg-gray-01',
  yellow: 'bg-brand-yellow',
}

export function GiantSwitch({
  accent = 'grey',
  imagePosition = 'left',
  installHoverShift = false,
  image,
  title,
  description,
  tags,
  actions,
  className,
}: GiantSwitchProps) {
  const hoverShiftDistance = imagePosition === 'left' ? '12px' : '-12px'
  const hoverShiftStyles = installHoverShift
    ? `
      @media (min-width: 48rem) {
        .giant-switch--install-hover .giant-switch__image {
          transition: transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .giant-switch--install-hover:has([data-giant-switch-install-trigger]:hover) .giant-switch__image,
        .giant-switch--install-hover:has([data-giant-switch-install-trigger]:focus-within) .giant-switch__image,
        .giant-switch--install-hover:has([data-giant-switch-install-trigger]:focus-visible) .giant-switch__image {
          transform: translateX(${hoverShiftDistance});
        }
      }
    `
    : undefined

  // Mobile: stacked flex-col. Desktop: absolute image disc + content block.
  const imageClass = [
    // Mobile — fills panel width, square, clipped to rounded-88.
    'giant-switch__image aspect-square w-full overflow-hidden rounded-[88px]',
    // Desktop — 566×566 disc inset 12 px, rounded-188, positioned by prop.
    'md:absolute md:top-3 md:aspect-auto md:h-[566px] md:w-[566px] md:rounded-[188px]',
    imagePosition === 'left' ? 'md:left-3' : 'md:right-3',
  ].join(' ')

  const contentClass = [
    // Mobile — in the flex column below the image, centered.
    'giant-switch__content flex flex-col items-center gap-10 pt-20 md:pt-0',
    // Desktop — absolutely positioned beside the image.
    'md:absolute md:top-1/2 md:-translate-y-1/2 md:items-start',
    imagePosition === 'left'
      ? 'md:left-[714px] md:w-[583px]'
      : 'md:left-[238px] md:w-[464px]',
  ].join(' ')

  return (
    <div
      className={`w-full px-3 ${installHoverShift ? 'giant-switch--install-hover' : ''} ${className ?? ''}`}
    >
      {hoverShiftStyles ? <style>{hoverShiftStyles}</style> : null}
      <div
        className={`relative flex w-full flex-col overflow-hidden rounded-[100px] p-3 pb-14 md:block md:h-[590px] md:rounded-[200px] md:p-0 ${accentBg[accent]}`}
      >
        {/* Image */}
        <div className={imageClass}>
          <div className="relative size-full [&>*]:size-full [&>*]:object-cover">
            {image}
          </div>
        </div>

        {/* Content */}
        <div className={contentClass}>
          <div className="flex w-full flex-col items-center gap-6 md:items-start">
            <p className="w-full text-center font-display text-[30px] leading-none tracking-[-0.03em] text-brand-dark-green md:text-left md:text-[36px]">
              {title}
            </p>
            {description && (
              <div className="flex w-full flex-col items-center gap-5 md:items-start">
                <p className="w-full text-center font-sans text-[14px] leading-[1.2] text-brand-dark-green md:max-w-[464px] md:text-left">
                  {description}
                </p>
                {tags && (
                  <div className="flex w-full flex-wrap items-center justify-center gap-[6px] md:justify-start">
                    {tags}
                  </div>
                )}
              </div>
            )}
          </div>
          {actions && (
            <div className="flex w-full items-center justify-center gap-2.5 md:w-auto md:items-baseline md:justify-start">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Tag pill rendered inside <GiantSwitch tags={...} /> — off-white 50 % bg,
 * 14 px label, optional 14.4 px icon.
 */
export function GiantSwitchTag({
  icon,
  children,
}: {
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-off-white/50 px-2.5 py-2">
      {icon && (
        <span className="inline-block size-[14.4px] shrink-0 [&>*]:size-full">
          {icon}
        </span>
      )}
      <span className="font-sans text-[14px] leading-[1.2] text-brand-dark-green whitespace-nowrap">
        {children}
      </span>
    </span>
  )
}
