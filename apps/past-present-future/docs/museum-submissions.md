# Museum exhibit submissions

How the museum's exhibit submission form picks its backend endpoint and what it expects back, covering [`vite.config.js`](../vite.config.js), [`src/lib/museum-submission.js`](../src/lib/museum-submission.js) and [`src/lib/components/ExhibitSubmissionModal.svelte`](../src/lib/components/ExhibitSubmissionModal.svelte).

## Endpoint selection

The form posts to the admin-acid backend at `/api/forms/museum`. [`vite.config.js`](../vite.config.js) chooses the origin from `NEXT_PUBLIC_API_MODE` and bakes the full URL into the bundle as `import.meta.env.MUSEUM_SUBMISSION_ENDPOINT`. The endpoint is fixed at build time: changing the variable later has no effect on a build that already exists.

| `NEXT_PUBLIC_API_MODE` | Endpoint                                       |
| ---------------------- | ---------------------------------------------- |
| `development`          | `http://localhost:3003/api/forms/museum`       |
| `staging`              | `https://dev-admin-acid.logos.co/api/forms/museum` |
| `production`           | `https://admin-acid.logos.co/api/forms/museum` |

Vite reads the mode in this order:

1. `NEXT_PUBLIC_API_MODE` in the process environment.
2. `NEXT_PUBLIC_API_MODE` from a Vite `.env` file in `apps/past-present-future`.
3. A default: `development` for the dev server, `production` for builds.

Any other value stops Vite with `Invalid NEXT_PUBLIC_API_MODE`.

Builds default to production, so set the mode explicitly for a staging build:

```bash
NEXT_PUBLIC_API_MODE=staging pnpm --filter past-present-future build
```

[`turbo.json`](../turbo.json) lists `NEXT_PUBLIC_API_MODE` as an env input for the `build` and `dev` tasks, so Turbo does not reuse a cached build made with a different mode.

## Request and response

[`submitExhibit`](../src/lib/museum-submission.js) sends a `POST` with a JSON body, no credentials, and a 20 second timeout. The body has these fields:

| Field        | Contents                                                        |
| ------------ | --------------------------------------------------------------- |
| `name`       | Optional, up to 50 characters.                                  |
| `handle`     | Optional X handle, up to 15 characters.                         |
| `exhibition` | Required, one of the five exhibitions listed in the modal.      |
| `event`      | Required description of the historic event, up to 300 characters. |
| `source`     | Required `http://` or `https://` URL, up to 100 characters.     |
| `website`    | Hidden honeypot field. People leave it empty.                   |

The limits above are enforced in the browser only. The backend has to apply its own.

The modal shows its success state only when the response is 2xx and the JSON body contains `success: true`. A `429` shows "Too many submissions. Please try again in 15 minutes." Every other failure, including a timeout, a network error or a body without `success: true`, shows a generic "could not confirm delivery" message. The client does not retry, and the form keeps the answers so the person can send them again.

## Deploying

The form has no feature flag: any build of this app shows the "Submit an exhibit" buttons in the museum hero and footer. Deploy the matching admin-acid endpoint ([admin-acid.logos.co PR #97](https://github.com/acid-info/admin-acid.logos.co/pull/97)) to the target environment before you enable email delivery. Until the backend responds, every submission ends in the error message, but you can still use a frontend preview to review the modal UI.

## Testing locally

The dev server defaults to `development`, so the form posts to `http://localhost:3003`. Run the admin-acid backend on that port. `pnpm dev` also starts `apps/api` on port `3003`, so start this app on its own instead:

```bash
pnpm --filter past-present-future dev   # http://localhost:3006/past-present-future
```

To post to a deployed backend from the dev server, set the mode when you start it:

```bash
NEXT_PUBLIC_API_MODE=staging pnpm --filter past-present-future dev
```

See the [app README](../README.md) for running and building the app as a whole.
