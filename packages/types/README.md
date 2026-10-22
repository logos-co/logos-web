# @repo/types

TypeScript types shared across the monorepo. Mostly this is [`src/payload.ts`](src/payload.ts), the Payload-generated description of the CMS collections and globals.

Don't edit that file. Run `pnpm generate-types` from the repo root after changing a collection in `apps/cms`; it runs Payload typegen against `apps/cms/payload.config.ts` and rewrites `src/payload.ts`. Docs sync ignores the generated file for the same reason.

Two entrypoints: `.` re-exports [`src/index.ts`](src/index.ts), which passes on everything from the generated file, and `./payload` exposes that file directly.
