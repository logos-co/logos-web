import type { MusterCopySection } from '@repo/content/schemas'

import { Button, ButtonArrowIcon } from '@/components/ui'
import { Link } from '@/i18n/navigation'

export function Closing({
  copy,
  nextAvailable,
}: {
  copy: MusterCopySection['closing']
  nextAvailable: boolean
}) {
  const nextCase = (
    <>
      {copy.next.label}
      <ButtonArrowIcon width={48} height={24} />
    </>
  )

  return (
    <section
      className="muster-section muster-dark muster-closing"
      data-header-tone="dark"
    >
      <div className="muster-container">
        <p className="muster-subheading">{copy.lead}</p>
        <h2 className="muster-closing-diagram" data-muster-reveal>
          <span>
            {copy.left[0]}
            <br />
            {copy.left[1]}
          </span>
          <span className="muster-closing-line" aria-hidden="true" />
          <span>
            {copy.right[0]}
            <br />
            {copy.right[1]}
          </span>
        </h2>
        <Button
          href={copy.cta.href}
          className="muster-button muster-button-light"
        >
          {copy.cta.label}
        </Button>
        <div className="muster-next">
          <p>{copy.nextLabel}</p>
          {nextAvailable ? (
            <Link
              href={copy.next.href}
              className="muster-heading muster-next-case muster-next-link"
            >
              {nextCase}
            </Link>
          ) : (
            <span
              className="muster-heading muster-next-case"
              role="link"
              aria-disabled="true"
            >
              {nextCase}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
