import ContentWidth from '@/components/layout/content-width'

import { LOGOS_STACK } from '../_content'
import { BODY_18, MONO_CELL, TRIM } from './atoms'

/**
 * Figma strokes this frame with a hairline outside its top edge, so the line
 * sits on the section above. `-mt-px` plus `bg-clip-padding` puts the border on
 * that section's last pixel row and lets its grey show through the 25% black.
 *
 * Figma fixes the frame at 672px and centres its content 120px down. The 12px
 * table copy (10px in the file) runs the content taller, so the top padding is
 * pinned and the bottom absorbs it.
 */
export function LogosStack() {
  return (
    <section className="relative -mt-px border-t border-black/25 bg-brand-off-white bg-clip-padding py-16 text-brand-dark-green lg:min-h-[673px] lg:pt-[120px] lg:pb-[60px]">
      <ContentWidth className="flex flex-col gap-10 lg:gap-[60px]">
        <div className="flex flex-col gap-6">
          <h2 className={`text-h3-serif ${TRIM}`}>{LOGOS_STACK.heading}</h2>
          <p className={BODY_18}>{LOGOS_STACK.body}</p>
        </div>
        <div className="-mx-3 overflow-x-auto px-3">
          <table
            className={`w-full min-w-[720px] table-fixed border-collapse text-center ${MONO_CELL}`}
          >
            <colgroup>
              <col className="w-[140px] lg:w-[210px]" />
              <col />
              <col />
            </colgroup>
            {/* Figma shows no header row, so the headers are for screen readers
              only. The borderless, padding-free cells collapse the row to 0px
              and the first body row's top border draws the table's top edge. */}
            <thead>
              <tr>
                {LOGOS_STACK.columns.map((column) => (
                  <th key={column} scope="col" className="p-0">
                    <span className="sr-only">{column}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LOGOS_STACK.rows.map((row) => (
                <tr key={row.component}>
                  <th
                    scope="row"
                    className="border border-black p-3 font-medium"
                  >
                    {row.component}
                  </th>
                  <td className="border border-black p-3 desktop:whitespace-pre-line">
                    {row.role}
                  </td>
                  <td className="border border-black p-3">{row.covers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentWidth>
    </section>
  )
}
