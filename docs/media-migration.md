# blog.logos.co redirect map

blog.logos.co is moving to logos.co/media. The redirects live in Cloudflare, in the `logos.co` zone's dynamic redirect ruleset in [status-im/infra-sites](https://github.com/status-im/infra-sites/blob/master/redirects.tf). logos.co is served by nginx, so a `_redirects` file in this repo would do nothing. Inside the site, [`apps/web/lib/html-links.ts`](../apps/web/lib/html-links.ts) rewrites links to old blog URLs in CMS content to their new /media path.

Deploy the /media pages to logos.co first and check a few of them, then turn the redirects on. Every rule is a 301 that keeps the query string, and rules run top to bottom with the first match winning.

## Where each old URL goes

| Old URL on blog.logos.co                                      | New URL                                         | Why                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| `/article/<slug>`                                             | `https://logos.co/media/article/<slug>`         | Same article, new home                                                            |
| `/podcasts/<show>/<slug>`                                     | `https://logos.co/media/podcasts/<show>/<slug>` | Same episode, new home                                                            |
| `/rss/<feed>.xml`, `/rss.xml`, `/atom.xml`, `/atom_page2.xml` | Same path on logos.co                           | The build writes these feeds with the legacy guids, so subscribers see no repeats |
| `/security`, `/privacy-policy`                                | Same path on logos.co                           | These pages already exist on logos.co                                             |
| `/terms`                                                      | `https://logos.co/terms-and-conditions`         | logos.co has no `/terms`, it answers with the not found page                      |
| `/podcasts`, `/podcasts/<show>`                               | `https://logos.co/media/podcasts`               | The podcast listing replaces the old index and show listings                      |
| `/calendar`                                                   | `https://logos.co/logos-broadcast-network`      | That page shows the same events calendar                                          |
| `/`, `/search`, `/about`, and any other page                  | `https://logos.co/media`                        | The media landing replaces the blog home, search and about page                   |

## What logos.co needs from the old blog

Nothing in production. The media pages, the article cards across the site and the media search (a static index written at build time) read the CMS at cms-press.logos.co directly, and there is no fallback to the old blog.

No build reads blog.logos.co either, but they all need `STRAPI_API_KEY` for that CMS: local dev, CI, Vercel previews and Jenkins fail without it ([`apps/web/lib/blog-content.ts`](../apps/web/lib/blog-content.ts)). Production builds also fail without `SIMPLECAST_ACCESS_TOKEN`; other builds leave Simplecast episodes without their audio file.

## What stays on blog.logos.co for now

These paths must not redirect while the old blog is still running:

- `/preview/*` and any path containing `/id/`. The CMS sends editors to these draft previews, and they need a new home before the old blog is switched off.
- `/_next/*` and any other path with a file extension (images, icons, `robots.txt`, `sitemap.xml`). The preview pages need their assets, and the old sitemap helps Google find the redirects faster. The feeds above are the only files that move.

## After the switch

`curl -sI https://blog.logos.co/article/june-2026` should answer 301 to `https://logos.co/media/article/june-2026`, and that page should answer 200 with a self canonical.

Search Console's Change of Address tool only handles whole-site moves, so it does not apply to a subdomain moving into a path. Instead, confirm logos.co/sitemap.xml lists the /media pages and watch the blog.logos.co URLs move to "Page with redirect" in the page indexing report.

## Listing URLs on logos.co

The canonical listing pages are `/media/articles` and `/media/podcasts`. The site also builds static redirect pages for `/articles`, `/podcast`, `/podcasts` and `/podcasts/<show>`, so existing links still reach the listings. These use JavaScript and a zero-delay meta refresh with a canonical pointing at the new listing; they do not return an HTTP 301.

Once the new listings are live, add HTTP 301 redirects in the logos.co Cloudflare ruleset or nginx configuration, matching optional trailing slashes and preserving query strings:

| Old URL            | New URL           |
| ------------------ | ----------------- |
| `/articles`        | `/media/articles` |
| `/podcast`         | `/media/podcasts` |
| `/podcasts`        | `/media/podcasts` |
| `/podcasts/<show>` | `/media/podcasts` |

These infrastructure rules are managed outside this repository. Leave article and episode detail URLs unchanged.
