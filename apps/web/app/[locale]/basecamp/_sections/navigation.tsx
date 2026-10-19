import type { Renewal } from './atoms'
import { Brand } from './atoms'
import { InstallLink } from './install-link'

export function Navigation({ copy }: { copy: Renewal['nav'] }) {
  return (
    <header className="bc-nav">
      <div className="bc-nav-inner">
        <a href="/" className="cursor-pointer" aria-label={copy.homeLabel}>
          <Brand size={15} />
        </a>
        <nav>
          {copy.links.map((link) => (
            <a className="cursor-pointer" href={link.href} key={link.label}>
              {link.label}
            </a>
          ))}
        </nav>
        <InstallLink cta={copy.install} className="bc-nav-install" />
      </div>
    </header>
  )
}
