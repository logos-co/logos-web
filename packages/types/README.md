# @repo/types

Shared TypeScript types for the monorepo, including the Payload-generated [`src/payload.ts`](src/payload.ts).

`src/payload.ts` is generated from the CMS schema. Run `pnpm generate-types` from the repo root, which runs Payload typegen against `apps/cms/payload.config.ts`. Do not edit the file by hand; regenerate after any collection or schema change in `apps/cms`.

## Exports

- `.` re-exports [`src/index.ts`](src/index.ts), which re-exports the generated payload types.
- `./payload` exposes the generated [`src/payload.ts`](src/payload.ts) directly.
