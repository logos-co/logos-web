#!/bin/sh
# Production container entrypoint.
#
# Payload does NOT push the schema in production (see @payloadcms/db-postgres
# connect.js: pushDevSchema only runs when NODE_ENV !== 'production'). The
# repo policy is migrations for any deployed environment, so we apply pending
# SQL migrations before the server starts accepting traffic.
#
# `payload migrate` is idempotent — already-applied migrations are skipped, so
# this is safe to run on every (re)start.
set -e

echo "[entrypoint] Applying Payload migrations..."
PAYLOAD_CONFIG_PATH=payload.config.ts node_modules/.bin/payload migrate

echo "[entrypoint] Migrations done. Starting server..."
exec "$@"
