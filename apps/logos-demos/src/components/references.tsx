import type { Reference } from '@/demos/references'

/**
 * Where the demo's claims can be checked.
 *
 * Buttons rather than a list of links: these leave the page, and every one
 * opens in its own tab so a visitor never loses the demo they were trying.
 */
export function References({ items }: { items: readonly Reference[] }) {
  if (items.length === 0) return null

  return (
    <section
      aria-label="References"
      className="flex flex-col gap-4 border-t border-gray-01 pt-8"
    >
      <h2 className="text-h4-sans text-brand-dark-green">References</h2>

      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col gap-1 border border-gray-02 bg-white p-3 no-underline transition-colors hover:bg-gray-00 cursor-pointer"
            >
              <span className="text-body-sans text-brand-dark-green underline">
                {item.label}
              </span>
              <span className="text-body-sans text-gray-05">{item.note}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
