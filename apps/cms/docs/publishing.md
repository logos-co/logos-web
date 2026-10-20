# Article and site publishing

How published articles reach the site. Covers the site publish workflow in [`.github/workflows/site-publish.yml`](../../../.github/workflows/site-publish.yml), the reservation service in [`apps/cms/src/services/site-publish`](../src/services/site-publish) and the dashboard panel in [`apps/cms/src/components/admin/site-publish-panel.tsx`](../src/components/admin/site-publish-panel.tsx).

## Workflow

Publish articles in Strapi at <https://cms-press.logos.co/admin> first, then select **Build staging** in the Payload dashboard's **Staging** card. The CMS uses its GitHub App to send a `repository_dispatch` request to `.github/workflows/site-publish.yml`. GitHub Actions captures published media once, builds the static site from `develop` and updates `deploy-develop`. Review `dev.logos.co` with **View staging**, then select **Publish live** in the **Live** card and confirm the reviewed run. Production builds from `master` using that successful staging run's media snapshot; later Strapi edits are not fetched during the live build. **View live** opens `logos.co`. Editors do not need Jenkins access.

## Enabling the buttons

Before enabling the buttons:

- Merge the workflow to the default `develop` branch and deploy the updated CMS code.
- Give the CMS GitHub App **Contents: read and write**, **Pull requests: read and write**, **Metadata: read** and **Actions: read** access, then accept any installation permission update. Dispatch uses Contents permission; status and snapshot availability checks use Actions permission.
- Keep the existing `STRAPI_API_KEY` and `SIMPLECAST_ACCESS_TOKEN` repository Actions Secrets. Set the repository Actions variable `SITE_PUBLISH_APP_ID` to the CMS App ID and the Actions Secret `SITE_PUBLISH_APP_PRIVATE_KEY` to a dedicated private key generated for that App. No new CMS host or Vault variables are required. The workflow creates a short-lived, repository-scoped installation token with Contents write access immediately before publishing and revokes it at job completion.
- Add the CMS GitHub App to the push allowlist for `deploy-master`, preserving `status-im-auto` and all other branch protections. The default Actions token does not bypass this restriction. The workflow's default `GITHUB_TOKEN` only reads source, workflow history and artifacts; the App token publishes the static export.
- Keep both existing site push webhooks and the site's Git synchronisation enabled. The workflow checks the deployed `site-publish.json` marker before reporting success. Jenkins code deployments remain separate and keep their existing behaviour.

## Snapshots

Snapshots are private Actions artifacts retained for 14 days and archived only after a successful staging publication. Live publishing rechecks that the selected run is the latest successful staging preview from this workflow and that its snapshot still exists. Missing or expired snapshots require a new staging build. The snapshot is never placed in the public export. Remote media URLs remain external assets rather than immutable copies of every remote resource.

## Reservations

The CMS reserves one request atomically in Postgres across both environments and all replicas (a unique `site` key in the `site_publish_reservations` table). It keeps the reservation until GitHub Actions reports a newer run; confirmed rejected submissions release it. Lost responses retain the reservation because GitHub may have accepted the request. Apply the existing reservation migration before enabling the buttons. If a submission is interrupted and no run appears, an operator must verify that no site publishing workflow is pending or running before removing the stale row from `payload.site_publish_reservations` (or the configured Payload schema). Reservations do not expire automatically.

## Publishing guarantees

The workflow serialises staging and live publications and uses fast-forward pushes. It records the deployment branch before building and rejects a publish if another publisher has changed it. Live also checks the staging deployment marker and rejects a preview replaced by Jenkins or another publisher, including changes during the live build. Build failures are shown in the appropriate dashboard card; disabled actions include a short visible reason and an accessible description.
