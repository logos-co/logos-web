import Image from 'next/image'

import { HAZARDS, PROTECTION } from '../_content'
import { BODY_18, MONO_CELL, TRIM } from './atoms'

/**
 * Figma fixes this frame at 1074px and centres its content, which puts the
 * first heading 100.5px down. The 12px table copy (10px in the file) runs the
 * content 10px taller, so the top padding is pinned and the bottom absorbs it.
 */
export function Hazards() {
  return (
    <section className="flex flex-col gap-[60px] bg-brand-off-white px-3 py-16 text-brand-dark-green lg:min-h-[1074px] lg:pt-[100.5px] lg:pb-[60px]">
      <HazardClasses />
      <hr className="border-black/25" />
      <Protection />
      <ProtectionMatrix />
    </section>
  )
}

function HazardClasses() {
  return (
    // Figma fixes this block at 296px, a few px taller than its copy.
    <div className="lg:min-h-[296px]">
      <h2 className={`text-h3-serif lg:whitespace-pre-line ${TRIM}`}>
        {HAZARDS.heading}
      </h2>
      {/* Each column is a subgrid over four shared rows, so the closing
          paragraphs line up whichever column runs longer. */}
      <div
        className={`mt-10 grid gap-10 lg:mt-[58px] lg:grid-cols-2 lg:grid-rows-[repeat(4,auto)] lg:gap-x-[138px] lg:gap-y-0 ${BODY_18}`}
      >
        {HAZARDS.classes.map((hazard) => (
          <div
            key={hazard.name}
            className="flex flex-col lg:row-span-4 lg:grid lg:grid-rows-subgrid"
          >
            <h3 className="font-bold">{hazard.name}</h3>
            <p className="underline decoration-from-font [text-underline-position:from-font]">
              {hazard.who}
            </p>
            <p>{hazard.risk}</p>
            <p className="mt-[1.2em]">{hazard.bound}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Protection() {
  return (
    // Figma's row is 1415px wide, so the photo stops 1px short of the edge.
    <div className="flex flex-col gap-10 lg:mr-px lg:flex-row lg:justify-between">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-5">
          <h2 className={`text-h3-serif lg:whitespace-pre-line ${TRIM}`}>
            {PROTECTION.heading}
          </h2>
          <p className={`font-bold ${BODY_18}`}>{PROTECTION.lead}</p>
        </div>
        <div className={BODY_18}>
          <p>{PROTECTION.body[0]}</p>
          <p className="mt-[1.2em] lg:whitespace-pre-line">
            {PROTECTION.body[1]}
          </p>
        </div>
      </div>
      <div className="relative h-[232px] w-full shrink-0 overflow-hidden rounded-[20px] lg:w-[43%]">
        <Image
          src="/images/prifi/bokeh.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 609px, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  )
}

function ProtectionMatrix() {
  const { columns, rows } = PROTECTION.matrix

  return (
    <div className="-mx-3 overflow-x-auto px-3">
      <table
        className={`w-full min-w-[720px] table-fixed border-collapse text-center ${MONO_CELL}`}
      >
        <colgroup>
          <col className="w-[140px] lg:w-[210px]" />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr>
            <td />
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="h-10 border border-black bg-accent-steel-teal p-3 font-bold text-brand-off-white"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.hazard}>
              <th scope="row" className="border border-black p-3 font-medium">
                {row.hazard}
              </th>
              {row.cells.map((cell, index) => (
                <td key={index} className="border border-black p-3">
                  <span className="block font-bold">{cell.verdict}</span>
                  <span className="mt-3 block">{cell.reason}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
