import Link from 'next/link'

import { DEMOS } from '@/demos/registry'

export default function Page() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12 md:py-16">
      <h1 className="text-h3-sans text-brand-dark-green">Demos</h1>

      <ul className="flex flex-col gap-3">
        {DEMOS.map((demo) => (
          <li key={demo.href}>
            <Link
              href={demo.href}
              className="flex cursor-pointer flex-col gap-2 border border-gray-01 bg-white p-5 transition-colors hover:bg-accent-light-blue"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-h4-sans text-brand-dark-green">
                  {demo.label}
                </span>
                <span className="text-mono-s text-gray-05">{demo.stack}</span>
              </div>
              <span className="text-body-sans max-w-[62ch] text-gray-06">
                {demo.summary}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
