import Link from 'next/link'

import { DEMOS } from '@/demos/registry'

export default function Page() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12 md:py-16">
      <header className="flex flex-col gap-4">
        <p className="text-eyebrow text-gray-05">Logos stack · web demos</p>
        <h1 className="text-h1 max-w-[22ch] text-brand-dark-green">
          The Logos stack, from a browser.
        </h1>
        <p className="text-body-sans max-w-[62ch] text-gray-06">
          Each demo runs a Logos protocol inside your own browser. There is no
          account to create, nothing to install, and no backend of ours in the
          path — the page you are reading is static, and the network traffic
          leaves your browser for the network directly.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-eyebrow text-gray-05">Demos</h2>
        <ul className="flex flex-col gap-3">
          {DEMOS.map((demo) => (
            <li key={demo.href}>
              <Link
                href={demo.href}
                className="group flex cursor-pointer flex-col gap-2 border border-gray-01 bg-white p-5 transition-colors hover:bg-accent-light-blue"
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
      </section>

      <section className="flex flex-col gap-3 border-t border-gray-01 pt-8">
        <h2 className="text-eyebrow text-gray-05">Why this exists</h2>
        <p className="text-body-sans max-w-[62ch] text-gray-06">
          The way into Logos today is Basecamp, a desktop application you
          download as a 94 MB disk image or a 258 MB AppImage, unsigned on
          macOS, with no Windows build, whose first screen asks you to browse a
          catalogue and install your first app. These demos are the same
          technology behind a link instead — so that trying it costs a click,
          not an afternoon.
        </p>
        <p className="text-body-sans max-w-[62ch] text-gray-06">
          What runs here is real. It is also deliberately partial, and each demo
          says on its own page what it does not yet do.
        </p>
      </section>
    </div>
  )
}
