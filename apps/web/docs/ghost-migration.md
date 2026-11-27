# Ghost article migration

This covers the [Ghost preparation, import and verification scripts](../scripts/ghost-migration/), the [staging article allowlist](../lib/press-preview-articles.json) and the existing [snapshot boundary](../lib/press-snapshot.ts).

## Source and preview

The 26 November 2026 capture contains 41 public published Nomos posts and 46 public published Codex posts. Drafts, restricted posts and email-only sends are excluded. The captures retain the original Ghost HTML, Lexical document and metadata outside the repository. The current source slugs do not collide with each other or the committed published media snapshot.

Ghost Admin API requests use `https://ghost.status.im/nomos-blog/api/admin/` and `https://ghost.status.im/codex-blog/api/admin/`. Both require the GitHub OAuth proxy session and a Ghost Admin API JWT. Keep keys, tokens and session cookies out of files and logs. Capture only public published posts, walk every page and save the source JSON outside the repository.

Run from `apps/web`:

```bash
pnpm exec tsx scripts/ghost-migration/prepare.ts /path/to/capture-directory
pnpm exec tsx --env-file=/path/to/.env.migration scripts/ghost-migration/import.ts /path/to/capture-directory --apply
pnpm exec tsx --env-file=/path/to/.env.migration scripts/ghost-migration/verify-cms.ts /path/to/capture-directory
PRESS_CONTENT_SNAPSHOT=/path/to/capture-directory/press-snapshot.json pnpm exec tsx scripts/ghost-migration/verify.ts /path/to/capture-directory
```

Preparation expects `nomos-published.json` and `codex-published.json`, each with a `posts` array. It downloads 255 images and one linked PDF, preserves source image alternatives and captions, shifts source body headings below the page H1 and rewrites links only to known migrated articles. Legacy raw code blocks retain their literal TypeScript generics. The one source that uses KaTeX needs only Unicode variables, a subscript and an exponent; these are represented with static HTML. YouTube frames use the existing renderer. Retired Ghost newsletter widgets are omitted. Blog home links use `/media/articles`; migrated article links and the PDF link use their new local paths. No rendered article may reference either retired blog host. Source header and footer code injections are not executed.

The draft preview snapshot combines these 87 articles with the committed published media baseline. It uses version 2, marks every imported article as a draft and is rejected outside staging. The allowlist enables staging search and draft queries. Drafts remain excluded from public feeds and the sitemap. The 26 November preview uses the committed 5 November published baseline because `cms-press.logos.co` timed out; it is not a fresh capture of the existing Logos articles.

On 28 November 2026, all 87 articles were imported as CMS drafts and all 256 assets were uploaded. Verification re-read every draft, checked every public asset, confirmed PDF bytes and GIF frame counts, and compared all exported articles with the original captures. The replacement preview uses a fresh CMS capture and builds with no repository migration assets. The temporary `public/images/ghost-migration/` and `public/files/ghost-migration/` copies were removed after that build passed. The articles remain unpublished.

The [CMS image mapper](../lib/blog-content.ts) converts caption markup to plain text, keeps alternative text separate from credits and falls back to the article title when cover alternative text is missing.

## CMS import and release

Import requires a Strapi token with post, author, tag and upload access. It preflights all slugs, reuses matching authors and public tags, uploads images and creates draft Articles only. The CMS `body` contains migrated HTML and `markdown_body` holds a source ID and SHA-256 fingerprint. Complete original HTML and Ghost Lexical documents remain in the source capture, so CMS article fields do not retain retired asset URLs. Repeating an import accepts only identical drafts and stops on a published post or editorial changes. Verified IDs are written to `imported.json` after each article.

`STRAPI_API_KEY` is configured separately in GitHub Actions secrets, Vercel environments and the ignored local `apps/web/.env.local` file. Updating GitHub or Vercel does not refresh the local copy. Pull the current Vercel environment before testing credentials. GitHub exposes a secret's update time, not its value. Successful authenticated GET requests do not prove write access: a token can read the collections and upload list while receiving HTTP 403 from `POST /api/upload`. Use a separate temporary migration token with the required write permissions rather than widening the site's build token. Keep it in an ignored environment file outside the repository and pass that file to `tsx --env-file`.

Use the operator-provided write credential only for migration commands. Do not copy it into GitHub or Vercel site environments. Uploads run three at a time and reuse existing files by their stable names. Names longer than 100 characters use their existing URL hash and extension because the upload service adds suffixes for generated image variants. CMS verification re-reads every draft and checks body and metadata equality, uploaded asset availability, PDF bytes, image dimensions and GIF frame counts. It records byte equality for all assets in `cms-verification.json`.

Tag identifiers follow the existing CMS convention: spaces and hyphens become underscores, while original casing is retained. Existing tags are reused case-insensitively. The article renderer already displays underscores as spaces, so no CMS schema change is needed.

A preview built from the prepared snapshot does not imply that CMS import succeeded. Check `imported.json` and re-read all 87 CMS posts before reporting that the CMS drafts exist. If the CMS is unavailable, keep the import pending and label the deployed site as a snapshot preview.

Verification compares every complete exported article against captured source paragraphs, headings, captions, literal code blocks, images and video counts. It also checks noindex, search inclusion and exclusion from the sitemap and feed. Follow this with desktop and mobile browser checks.

Publish reviewed CMS posts and capture a new version 1 snapshot before production promotion. Coordinate the generated `redirects.json` map with the infrastructure owner only after production destinations are verified. See [deployment](../../../docs/deployment.md) for the normal staging and production process.

## Temporary files and CMS handover

The repository copies are temporary preview inputs. The final source of truth is `cms-press.logos.co` for all 87 articles and all 256 uploaded assets. Do not turn the capture directory or the migration asset directories into a permanent content source.

Complete the handover in this order:

1. Import all articles and assets into Strapi. Re-read every CMS article and verify its title, slug, publication date, authors, tags, body, cover and social image. Check every migrated image and PDF at its CMS storage URL against the retained source bytes. CMS article fields must contain no retired blog asset URLs or repository migration asset paths.
2. Capture a new staging snapshot from the live CMS, without pointing `PRESS_CONTENT_SNAPSHOT` at the prepared migration snapshot. Build and review the 87 CMS drafts with both repository migration asset directories absent. Verify that article pages, search, images, videos and the PDF work using CMS content and uploaded assets alone. Remove the repository asset copies once this verification passes, retaining the external source backup.
3. After the reviewed articles are published through the normal workflow, capture published CMS content again and verify that the snapshot is version 1. Remove only these 87 slugs from `lib/press-preview-articles.json`, preserving the existing Waku entries.
4. Remove any remaining repository migration asset directories, `scripts/ghost-migration/` and `lib/__tests__/ghost-migration.test.ts`. Update the preview allowlist test to match the remaining entries. Remove this migration document and its index entry after retaining the handover evidence outside the repository. Remove any build configuration that points to the prepared migration snapshot; retire the temporary Vercel preview after the replacement deployment is verified.
5. Build again through the normal CMS pipeline and verify the deployed result before completing the handover. Keep the existing CMS loader, image generator and standard CMS-derived outage snapshot mechanism. They are the normal site architecture, not migration-specific source files.

Keep the original captures, asset backups, redirect map and CMS import receipt outside the repository until handover and redirect verification are complete. Do not delete preview inputs before the CMS-only replacement has passed verification.
