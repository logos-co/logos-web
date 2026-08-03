# Logos CRM — Self-hosted Deployment Specification

## 1. Supported deployment model

The only supported application deployment target is a Logos-operated Linux host with Docker Engine and Docker Compose. Development, staging, and production use the same three long-running services with environment-specific configuration; migrations use a short-lived command from the same application image.

Vercel, hosted databases, Redis, Upstash, Vercel KV, hosted queues, and Kubernetes are not dependencies. Authentication, TLS, the external reverse proxy, and SMTP are supplied by Infra and remain outside this Compose project.

## 2. Compose topology

| Service  | Responsibility                                                         |
| -------- | ---------------------------------------------------------------------- |
| `web`    | Next.js UI, Route Handlers, health checks, and authenticated downloads |
| `worker` | Graphile Worker notifications, imports, exports, and task reminders    |
| `crm-db` | PostgreSQL application data and Graphile Worker queue                  |

The web and worker services share one application image but use separate commands and health checks. `crm-db` and `worker` publish no host ports. `web` binds only to localhost or an Infra-approved private interface and must not be directly internet-accessible.

Required named volumes:

- `crm-db-data` for PostgreSQL;
- `crm-files` mounted by `web` and `worker`, with protected `/imports` and `/exports` subdirectories.

Production images are pinned by version or digest and never use `latest` tags.

## 3. Environment configuration

Configuration is typed, server-only, scoped to the consuming service, and validated at startup.

```text
DATABASE_URL
AUTH_USER_SUBJECT_HEADER
AUTH_USER_EMAIL_HEADER
AUTH_PROXY_SECRET_HEADER
AUTH_PROXY_SHARED_SECRET
CRM_PUBLIC_URL
SMTP_ENABLED
SMTP_SERVER
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
SMTP_FROM
SMTP_TLS_ENABLE
DISCORD_ENABLED
DISCORD_BOT_TOKEN
DISCORD_DEFAULT_CHANNEL_ID
EXPORT_DIRECTORY
EXPORT_RETENTION_HOURS
IMPORT_DIRECTORY
IMPORT_RETENTION_HOURS
IMPORT_MAX_BYTES
IMPORT_MAX_ROWS
LOG_LEVEL
CRM_STALE_CONTACT_DAYS
DEV_USER_SUBJECT_MOCK
DEV_USER_EMAIL_MOCK
```

The SMTP names and TLS behaviour intentionally match the existing `admin-acid` deployment contract. The worker receives SMTP and Discord credentials; the web service does not. When an integration is disabled, its credentials are optional and no jobs are created for that channel. Enabled but incomplete integration configuration fails startup.

`EXPORT_DIRECTORY` and `IMPORT_DIRECTORY` point to separate subdirectories in the shared `crm-files` volume. Neither directory is exposed as a static reverse-proxy path. The web writes uploads and streams authorised downloads; the worker processes and expires files.

Secrets use Compose secrets or root-owned environment files outside the repository. Applications support `_FILE` variants for database, proxy-verification, SMTP, and Discord secrets. Development identity mocks work only outside production; production startup fails if either mock variable is set.

## 4. Trusted proxy contract

Infra must strip incoming copies of all configured identity and proxy-verification headers, authenticate the request, then inject the immutable subject, current email, and shared verification value. The CRM compares the verification value in constant time and rejects missing or invalid headers before user lookup. The immutable subject, not email, identifies the local user.

The shared secret is a defence-in-depth control in addition to binding `web` to a non-public interface. Infra owns secret rotation and coordinates overlapping old/new values during rotation.

## 5. Container behaviour

- `crm-db` has a PostgreSQL readiness check and persistent storage.
- A one-shot `migrate` profile/service runs `drizzle-kit migrate` from the application image and exits; there is no custom migration runner.
- `web` exposes `/api/health/live` and `/api/health/ready`.
- `worker` waits for database readiness, handles `SIGTERM`, stops claiming jobs, and finishes or safely releases active work.
- Services use `restart: unless-stopped`, bounded CPU/memory settings, and Docker log rotation.
- The application image runs as a non-root user and excludes development dependencies and source secrets.

## 6. Release procedure

1. Build and scan the immutable application image.
2. Pull or build all pinned Compose images.
3. Run the one-shot migration service.
4. Verify database readiness and migration version.
5. Recreate web and worker services.
6. Smoke-test authentication through the Infra proxy, `/api/v1/me`, task processing, export-volume access, and worker health.
7. Confirm backup and log collection are active.

Migrations follow expand-and-contract changes so the existing and next application versions can overlap safely during recreation.

## 7. Backup and recovery

Backups use a host-controlled scheduled command that runs `pg_dump` against `crm-db`; no scheduler container is required. The runbook defines frequency, retention, encryption, access control, restore to an isolated Compose project, recovery objectives, and quarterly restore verification.

Catalogue, workflow history, jobs, and audit tables are included. Short-lived exports and raw import files are excluded from long-term backups.

## 8. Operational acceptance criteria

A clean Linux host must be able to:

- start database, web, and worker with Docker Compose;
- run migrations and the idempotent admin-bootstrap command;
- accept verified Infra proxy identity and reject forged/direct identity headers;
- create a case and task, enqueue a Graphile Worker job, and send through the existing SMTP configuration;
- restart the worker without losing or duplicating work;
- run imports, exports, and notifications without Redis or another broker;
- perform the documented backup and restore;
- run without any Vercel-specific build, runtime, or storage feature.
