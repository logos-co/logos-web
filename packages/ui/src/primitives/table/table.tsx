/**
 * @figma-path   Table / Ideas
 * @figma-node   2213:29938 (default) · 2213:30073 (hover)
 * @figma-source internal-copy
 *
 * Compositional table primitive:
 *
 *   <Table title="Ideas" subtitle="..." action={<Button variant="link">...} >
 *     <TableRow
 *       number="01"
 *       title="Secure and Decentralized Frontends"
 *       description={<><p>Quadratic voting…</p><p>Idea by @jonny</p></>}
 *       reward={<><p>2500 USDC</p><p>+ 1000 XP</p></>}
 *       action={<Button variant="link">Apply</Button>}
 *     />
 *   </Table>
 *
 * Rows alternate bg (grey-01 / dark-green 5 %) via nth-child, and switch to
 * accent-light-blue on hover. All sizes are flexible via props / className.
 */
import type { ReactNode } from 'react'

type TableProps = {
  /** Serif heading shown top-left. */
  title: ReactNode
  /** Mono supporting copy shown next to the title. */
  subtitle?: ReactNode
  /** Action slot — typically a <Button variant="link">. */
  action?: ReactNode
  /** <TableRow /> children. */
  children: ReactNode
  className?: string
}

export function Table({
  title,
  subtitle,
  action,
  children,
  className,
}: TableProps) {
  return (
    <div
      className={`flex w-full flex-col border-t border-brand-dark-green/10 ${className ?? ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-6 px-3 pt-[27px] pb-5">
        <div className="flex w-[100px] shrink-0 items-start">
          <p className="font-display text-[36px] leading-none tracking-[-0.03em] text-brand-dark-green whitespace-nowrap">
            {title}
          </p>
        </div>
        <div className="flex flex-1 items-start gap-6">
          {subtitle && (
            <p className="max-w-[226px] font-mono text-[10px] leading-[1.3] text-brand-dark-green">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Rows */}
      <div className="flex w-full flex-col">{children}</div>
    </div>
  )
}

type TableRowProps = {
  /** Index / ordinal label shown on the left. */
  number?: ReactNode
  /** Serif row title. */
  title: ReactNode
  /** Mono description block. Pass multiple <p> for multi-line. */
  description?: ReactNode
  /** Mono reward block. Pass multiple <p> for multi-line. */
  reward?: ReactNode
  /** Action slot — typically a <Button variant="link">. */
  action?: ReactNode
  className?: string
}

export function TableRow({
  number,
  title,
  description,
  reward,
  action,
  className,
}: TableRowProps) {
  return (
    <div
      className={`group/row flex h-[50px] w-full min-w-0 items-start gap-3 bg-gray-01 px-3 py-3 transition-colors duration-150 odd:bg-brand-dark-green/5 hover:cursor-pointer hover:bg-accent-light-blue ${className ?? ''}`}
    >
      {/* Number + Title — takes roughly 714/1440 of row width */}
      <div className="flex min-w-0 flex-1 items-baseline gap-3 text-[14px] text-brand-dark-green md:flex-[714]">
        {number !== undefined && (
          <span className="w-[18px] shrink-0 font-sans leading-[1.2]">
            {number}
          </span>
        )}
        <span className="truncate font-display leading-[1.2] md:whitespace-nowrap">
          {title}
        </span>
      </div>

      {/* Description — 464/1440 */}
      <div className="hidden flex-[464] font-mono text-[10px] leading-[1.3] text-brand-dark-green md:block [&>p]:leading-[1.3]">
        {description}
      </div>

      {/* Reward — fixed 107px */}
      <div className="hidden w-[107px] shrink-0 font-mono text-[10px] leading-[1.3] text-brand-dark-green md:block [&>p]:leading-[1.3]">
        {reward}
      </div>

      {/* Action */}
      {action && <div className="hidden shrink-0 md:block">{action}</div>}
    </div>
  )
}
