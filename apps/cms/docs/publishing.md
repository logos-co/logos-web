# Publishing articles and the site

Editors publish articles in Strapi and then push the site live from the Payload dashboard, without
touching Jenkins. This page covers the two dashboard buttons, the workflow behind them, the
reservation that stops two publishes from running at once and the checks on merging content PRs.
Code:
[`.github/workflows/site-publish.yml`](../../../.github/workflows/site-publish.yml),
[`apps/cms/src/services/site-publish`](../src/services/site-publish),
[`apps/cms/src/components/admin/site-publish-panel.tsx`](../src/components/admin/site-publish-panel.tsx),
the labels in [`apps/cms/src/messages/site-publish.en.json`](../src/messages/site-publish.en.json)
and the content PR workflow in
[`apps/cms/src/services/content-workflow`](../src/services/content-workflow).

## How an editor publishes

Write and publish the article in Strapi at <https://cms-press.logos.co/admin> first. Payload only
builds the site, so an article that is still a draft there will not appear anywhere.

Then open the dashboard and use the **Staging** card. **Build staging** sends a
`repository_dispatch` event to the workflow, which captures the published media once, builds the
static site from `develop` and fast-forwards `deploy-develop`. **View staging** opens
dev.logos.co, where you check the result.

When the staging build looks right, use **Publish live**. The confirmation names the build number
it is about to publish, so you can tell which staging preview you reviewed. The live build runs
from `master` with the media snapshot of that staging run, and no Strapi request happens during it,
so an edit made after the staging build does not change what goes live. **View live** opens
logos.co.

The cards say why an action is unavailable instead of failing quietly: a build already in progress,
no staging preview yet, a failed build, or publishing switched off.

## Merging content edits before a build

Staging builds from `develop`, so a Payload edit only shows up there once its content PR is merged.
Each save commits to one draft PR per content file, and later saves to the same file reuse it. For
most collections that means one PR per record. Builder Resources and Circle Resources each live in a
single shared file, so edits to different resources in one of those lists go into the same PR.

The CMS only reuses or merges an open PR that the CMS GitHub App opened from a branch with the
configured content branch prefix against the configured PR base branch. Its full diff must contain
only `content/**` JSON files and image uploads under `apps/web/public/cms/uploads/`, all regular
files. Anything else stops the save or the merge with an error.

**Merge** sends the PR head commit you were shown, and the CMS merges that exact commit. If someone
saved a newer change since you loaded the page, the CMS asks you to refresh and review the PR again
before merging.

The Content Change Requests collection mirrors these PRs. Signed-in editors can view its records,
but only the CMS workflow creates, edits or deletes them.

## What the buttons need before they work

- The workflow merged to `develop` and the current CMS code deployed.
- The CMS GitHub App with **Contents: read and write**, **Pull requests: read and write**,
  **Metadata: read** and **Actions: read**. Accept any installation permission update after
  changing them. The dispatch itself uses Contents, and the status and snapshot checks use Actions.
- The `STRAPI_API_KEY` and `SIMPLECAST_ACCESS_TOKEN` repository secrets, which the staging build
  already uses. The App ID goes in the `SITE_PUBLISH_APP_ID` repository variable and a private key
  for that App in the `SITE_PUBLISH_APP_PRIVATE_KEY` secret. No Vault or CMS host variables are
  involved.
- The CMS App on the push allowlist of `deploy-master`, next to `status-im-auto` and every other
  entry branch protection already has. The workflow's own `GITHUB_TOKEN` cannot push there.
- Both existing site push webhooks and the site's Git synchronisation left enabled. After the push,
  the workflow polls `site-publish.json` on the deployed site and only reports success once that
  marker shows the new build.

The workflow creates a short-lived installation token just before publishing and revokes it when
the job ends. Jenkins code deployments are a separate path and keep working as before.

## Media snapshots

A staging build saves the captured media as a private Actions artifact for 14 days. Live publishing
restores that artifact, and only after checking that the run you picked is still the latest
successful staging preview from this workflow and that its artifact has not expired. If either
check fails, build staging again. The snapshot never lands in the public export, and remote media
URLs stay remote: the snapshot records the list of published items, not copies of every file.

## One publish at a time

The workflow runs in a single `site-publish` concurrency group, and the CMS adds a second guard: a
row in `payload.site_publish_reservations` with a unique `key` of `site`, inserted in Postgres, which
serialises the two environments across all CMS replicas. The row stays until GitHub Actions reports
a newer run, so a request whose response got lost keeps its reservation rather than inviting a
retry that GitHub may have already accepted. A dispatch the CMS can see was rejected releases it
straight away.

Reservations never expire. If a request was interrupted and no run ever appeared, check that no
site publish workflow is pending or running before deleting the row by hand. Apply the reservation
migration before enabling the buttons.

## Why a publish can still be refused

Both environments are serialised and pushed as fast-forwards, so the workflow records the
deployment branch it is about to extend and rejects the publish if another publisher moved it in
the meantime. A live publish also rechecks the staging marker, which catches a preview that Jenkins
or someone else replaced, including a change made while the live build was running. In all these
cases you get a failure in the card, not a half-published site: rebuild staging and publish again.
