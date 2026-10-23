import type { Renewal } from './atoms'
import { InstallLink } from './install-link'

export function Subnavigation({ copy }: { copy: Renewal['subnav'] }) {
  return (
    <nav className="bc-subnav">
      <div className="bc-subnav-inner">
        <div className="bc-subnav-paths">
          <div className="bc-subnav-group">
            <span>{copy.useLabel}</span>
            {copy.useLinks.map((link, index) => (
              <a
                className={`cursor-pointer${index === 0 ? ' is-active' : ''}`}
                key={link.label}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>
          <span className="bc-subnav-divider" aria-hidden="true" />
          <div className="bc-subnav-group">
            <span>{copy.buildLabel}</span>
            {copy.buildLinks.map((link) => (
              <a className="cursor-pointer" key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <InstallLink cta={copy.install} className="bc-subnav-install" />
      </div>
    </nav>
  )
}
