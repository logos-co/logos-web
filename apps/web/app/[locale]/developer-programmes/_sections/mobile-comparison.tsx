import type { DeveloperProgrammesCopySection } from '@repo/content/schemas'
import { Copy, Cta, DesktopLines } from './atoms'

interface MobileComparisonProps {
  programmes: DeveloperProgrammesCopySection['programmes']
  heading: string
}

export function MobileComparison({
  programmes,
  heading,
}: MobileComparisonProps) {
  const rowCount = Math.max(
    ...programmes.map(({ comparison }) => comparison.length)
  )

  return (
    <section className="dp-mobile-comparison dp-mobile-only">
      <h2 className="dp-section-heading">{heading}</h2>
      <div className="dp-mobile-compare-card">
        <div className="dp-mobile-compare-header">
          {programmes.map((programme) => (
            <div key={programme.id} className={`dp-${programme.id}`}>
              <p className="dp-tag dp-eyebrow">{programme.comparisonTag}</p>
              <h3>
                <Copy markSize={20.25} fontSize={25}>
                  {programme.name}
                </Copy>
              </h3>
            </div>
          ))}
        </div>
        <dl>
          {Array.from({ length: rowCount }, (_, rowIndex) => {
            const rows = programmes.map(
              ({ comparison }) => comparison[rowIndex]
            )
            const sharedLabel = rows.every(
              (row) => row?.label === rows[0]?.label
            )

            return (
              <div className="dp-mobile-compare-row" key={rowIndex}>
                <dt
                  className={`dp-eyebrow ${sharedLabel ? '' : 'dp-mobile-compare-labels'}`}
                >
                  {sharedLabel
                    ? rows[0]?.label
                    : rows.map((row, index) => (
                        <span key={programmes[index]!.id}>{row?.label}</span>
                      ))}
                </dt>
                <dd>
                  {rows.map((row, index) => (
                    <p key={programmes[index]!.id}>
                      {row && (
                        <>
                          <span className="sr-only">
                            {programmes[index]!.name.replace(
                              '{mark}',
                              'Lambda '
                            )}
                            :{' '}
                          </span>
                          <DesktopLines>{row.body}</DesktopLines>
                        </>
                      )}
                    </p>
                  ))}
                </dd>
              </div>
            )
          })}
        </dl>
        <div className="dp-mobile-compare-actions">
          {programmes.map((programme) => (
            <div key={programme.id}>
              <Cta link={programme.cta} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
