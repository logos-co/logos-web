# Article discussion previews

How [the forum topic parser](../lib/discourse-topic.ts) and [the article discussion section](../app/%5Blocale%5D/media/article/%5Bslug%5D/_sections/article-discussion.tsx) show replies on media articles.

The static build includes up to three replies. The browser refreshes them from the forum after the page loads and keeps the build snapshot if the request fails.

Both paths use the same HTML allowlist before rendering. It keeps basic formatting, links and images, and drops scripts, forms, embeds, inline styles and event handlers. Link URLs may be relative or use HTTP, HTTPS or mailto. Image URLs may be relative or use HTTP or HTTPS.
