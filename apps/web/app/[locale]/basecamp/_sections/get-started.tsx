import type { Renewal } from './atoms'
import { InstallLink } from './install-link'

export function GetStarted({ copy }: { copy: Renewal['started'] }) {
  return (
    <section className="bc-started">
      <h2>{copy.title}</h2>
      <div className="bc-started-grid">
        <article>
          <small>{copy.install.eyebrow}</small>
          <h3>{copy.install.title}</h3>
          <div className="bc-started-links">
            {copy.install.links.map((link, index) =>
              index < 2 ? (
                <InstallLink
                  cta={{ ...link, external: true, iconOverride: 'download' }}
                  platform={index === 0 ? 'macos' : 'linux'}
                  key={link.label}
                  className="bc-started-link"
                />
              ) : (
                <a href={link.href} key={link.label} className="cursor-pointer">
                  {link.label}
                </a>
              )
            )}
          </div>
          <div className="bc-started-platforms">
            {copy.install.platforms.map((item, index) => (
              <span key={item}>
                <i className={index === 2 ? 'is-roadmap' : ''} />
                {item}
              </span>
            ))}
          </div>
        </article>
        <article>
          <small>{copy.docs.eyebrow}</small>
          <h3>{copy.docs.title}</h3>
          <div className="bc-started-links">
            {copy.docs.links.map((link) => (
              <a href={link.href} key={link.label} className="cursor-pointer">
                {link.label}
              </a>
            ))}
          </div>
        </article>
        <article>
          <small>{copy.video.eyebrow}</small>
          <h3>{copy.video.title}</h3>
          <div className="bc-started-links">
            <a href={copy.video.link.href} className="cursor-pointer">
              {copy.video.link.label}
            </a>
          </div>
        </article>
      </div>
    </section>
  )
}
