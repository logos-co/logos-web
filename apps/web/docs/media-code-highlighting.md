# Media code highlighting

Code blocks in media articles and podcast content are prepared by [the HTML pipeline](../lib/media-html.ts) and styled by [the media stylesheet](../app/[locale]/media/media-detail.css).

Normal CMS HTML is sanitised before `rehype-highlight` generates token spans at build time. The browser receives the highlighted HTML and scoped token colours, without downloading a syntax highlighter. Source code, whitespace and TypeScript generics remain text. Inline code keeps its existing appearance.

Use a `language-*` or `lang-*` class on a `<pre><code>` element to select a supported language. Unlabelled blocks, including migrated Ghost content, use automatic detection. Unsupported language names retain readable code. To turn highlighting and detection off for a block, mark it as plain text with `language-text`, `language-txt`, `language-plain` or `language-plaintext` (or the `lang-*` form), or use `no-highlight` or `nohighlight`.

Structured CMS `code-block` entries keep their original code and language fields. The pipeline generates `highlightedHtml` from those fields for [the media renderer](../app/[locale]/media/_components/media-rich-content.tsx); it never trusts an incoming `highlightedHtml` value. Interactive document embeds retain their own styles and are not processed by this pipeline.

Code blocks use a near-black background with light text and token colours. The existing font and horizontal scrolling remain in place. Token colours are scoped to media `<pre>` elements. Check desktop and mobile layouts in a browser when changing them.
