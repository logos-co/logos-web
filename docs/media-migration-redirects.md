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
| `/security`, `/privacy-policy`                                | Same path on logos.co                           | These pages already exist on logos.co                                             |
| `/terms`                                                      | `https://logos.co/terms-and-conditions`         | logos.co has no `/terms`, it answers with the not found page                      |
| `/podcasts`, `/podcasts/<show>`                               | `https://logos.co/media#podcasts`               | There is no show listing page, the podcasts section replaces it                   |
| `/calendar`                                                   | `https://logos.co/logos-broadcast-network`      | That page shows the same events calendar                                          |
| `/`, `/search`, `/about`, and any other page                  | `https://logos.co/media`                        | The media landing replaces the blog home, search and about page                   |

## What logos.co needs from the old blog

Nothing in production. Every media page, the article cards across the site and the media search (a static index written at build time) read the CMS at cms-press.logos.co directly.

No other build needs it either: there is no fallback to the old blog. Every build (local dev, CI, Vercel previews, Jenkins) fails without `STRAPI_API_KEY`. Production builds also fail without `SIMPLECAST_ACCESS_TOKEN`; other builds leave Simplecast episodes without their audio file.

## What stays on blog.logos.co for now

These paths must not redirect while the old blog is still running:

- `/preview/*` and any path containing `/id/`: the CMS sends editors to these draft previews. They need a new home before the old blog is switched off.
- `/_next/*` and any other path with a file extension (images, icons, `robots.txt`, `sitemap.xml`): the preview pages need their assets, and the old sitemap helps Google find the redirects faster. The feeds listed above are the only files that move.

## After the switch

- `curl -sI https://blog.logos.co/article/june-2026` answers 301 to `https://logos.co/media/article/june-2026`, and that page answers 200 with a self canonical.
- Search Console's Change of Address tool only handles whole-site moves, so it does not apply to a subdomain moving into a path. Instead, confirm logos.co/sitemap.xml lists the /media pages and watch the blog.logos.co URLs move to "Page with redirect" in the page indexing report.
