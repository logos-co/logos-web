# blog.logos.co redirect map

blog.logos.co is moving to logos.co/media. The redirects live in Cloudflare, in the `logos.co` zone's dynamic redirect ruleset in [status-im/infra-sites](https://github.com/status-im/infra-sites/blob/master/redirects.tf). logos.co is served by nginx, so a `_redirects` file in this repo would do nothing.

Rollout order: deploy the /media pages to logos.co first, check a few of them, then turn the redirects on.

## Where each old URL goes

Rules run top to bottom and the first match wins. All redirects are 301 and keep the query string.

| Old URL on blog.logos.co                                      | New URL                                         | Why                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| `/article/<slug>`                                             | `https://logos.co/media/article/<slug>`         | Same article, new home                                                            |
| `/podcasts/<show>/<slug>`                                     | `https://logos.co/media/podcasts/<show>/<slug>` | Same episode, new home                                                            |
| `/rss/<feed>.xml`, `/rss.xml`, `/atom.xml`, `/atom_page2.xml` | Same path on logos.co                           | The build writes these feeds with the legacy guids, so subscribers see no repeats |
| `/security`, `/terms`, `/privacy-policy`                      | Same path on logos.co                           | These pages already exist on logos.co                                             |
| `/podcasts`, `/podcasts/<show>`                               | `https://logos.co/media#podcasts`               | There is no show listing page, the podcasts section replaces it                   |
| `/calendar`                                                   | `https://logos.co/logos-broadcast-network`      | That page shows the same events calendar                                          |
| `/`, `/search`, `/about`, and any other page                  | `https://logos.co/media`                        | The media landing replaces the blog home, search and about page                   |

## What stays on blog.logos.co for now

These paths must not redirect until the old blog is switched off:

- `/api/*`: the /media landing page reads the legacy search API at build time. The header search calls the same API on lpe-seven.vercel.app, a separate deployment of the old blog.
- `/preview/*` and any path containing `/id/`: the CMS sends editors to these draft previews.
- `/_next/*` and any other path with a file extension (images, icons, `robots.txt`, `sitemap.xml`): the preview pages need their assets, and the old sitemap helps Google find the redirects faster. The feeds listed above are the only files that move.

Before blog.logos.co can be switched off, the /media landing and header search have to read Strapi directly and the CMS previews need a new home.

## After the switch

- `curl -sI https://blog.logos.co/article/june-2026` answers 301 to `https://logos.co/media/article/june-2026`, and that page answers 200 with a self canonical.
- `curl -sI https://blog.logos.co/api/search` still answers 200 from the old blog.
- Search Console's Change of Address tool only handles whole-site moves, so it does not apply to a subdomain moving into a path. Instead, confirm logos.co/sitemap.xml lists the /media pages and watch the blog.logos.co URLs move to "Page with redirect" in the page indexing report.
