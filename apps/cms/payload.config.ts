import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import { ContentChangeRequests } from './src/collections/ContentChangeRequests'
import {
  CircleEvents,
  CircleInitiatives,
  CircleResources,
  Circles,
} from './src/collections/Circles'
import { Ideas } from './src/collections/Ideas'
import { Pages } from './src/collections/Pages'
import { Rfps } from './src/collections/Rfps'
import { Users } from './src/collections/Users'
import { SiteSettings } from './src/globals/SiteSettings'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const isProduction = process.env.NODE_ENV === 'production'
const isVercel = Boolean(process.env.VERCEL)

// Production target is self-hosted Node; Vercel is dev/staging only. Require
// explicit URL env vars in any production environment that is not Vercel —
// the Vercel-injected `VERCEL_URL` fallback is convenience for previews and
// must not silently apply to a self-hosted prod cluster.
if (isProduction && !isVercel) {
  if (!process.env.NEXT_PUBLIC_SERVER_URL) {
    throw new Error(
      'NEXT_PUBLIC_SERVER_URL is required in production (self-hosted) — set it to the public CMS origin (e.g. https://cms.example.com).'
    )
  }
  if (!process.env.NEXT_PUBLIC_WEB_URL) {
    throw new Error(
      'NEXT_PUBLIC_WEB_URL is required in production (self-hosted) — set it to the public web origin used for CORS / CSRF.'
    )
  }
}

// Server URL — explicit env wins; on Vercel fall back to the auto-injected
// `VERCEL_URL` (preview URLs change per deploy). Local dev defaults to
// localhost:3001.
const serverURL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3001')

const frontendURL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'

// Database — Postgres (Supabase / Neon / Vercel Postgres). The schema name
// scopes Payload tables under a dedicated namespace, so coexisting with other
// apps that share the same database is safe.
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required (postgresql:// connection string). ' +
      'For local dev copy apps/cms/.env.example to apps/cms/.env and fill it in.'
  )
}

const payloadSecret = process.env.PAYLOAD_SECRET
if (isProduction && !payloadSecret) {
  throw new Error(
    'PAYLOAD_SECRET environment variable is required in production'
  )
}

const defaultDatabasePoolMax = isVercel ? '3' : isProduction ? '10' : '3'
const databasePoolMax = Number.parseInt(
  process.env.PAYLOAD_DB_POOL_MAX || defaultDatabasePoolMax,
  10
)
if (!Number.isInteger(databasePoolMax) || databasePoolMax < 1) {
  throw new Error('PAYLOAD_DB_POOL_MAX must be a positive integer')
}

const parsePositiveIntEnv = (name: string, fallback: number): number => {
  const rawValue = process.env[name]
  if (!rawValue) {
    return fallback
  }

  const value = Number.parseInt(rawValue, 10)
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`)
  }

  return value
}

const databaseConnectionTimeoutMs = parsePositiveIntEnv(
  'PAYLOAD_DB_CONNECTION_TIMEOUT_MS',
  5000
)
const databaseQueryTimeoutMs = parsePositiveIntEnv(
  'PAYLOAD_DB_QUERY_TIMEOUT_MS',
  15000
)
const databaseIdleTimeoutMs = parsePositiveIntEnv(
  'PAYLOAD_DB_IDLE_TIMEOUT_MS',
  5000
)

export default buildConfig({
  admin: {
    components: {
      graphics: {
        Icon: '@/components/admin/logos-admin-icon.tsx#LogosAdminIcon',
      },
    },
    meta: {
      icons: '/favicon.ico',
    },
    user: Users.slug,
  },
  collections: [
    Users,
    Pages,
    Rfps,
    Ideas,
    Circles,
    CircleEvents,
    CircleInitiatives,
    CircleResources,
    ContentChangeRequests,
  ],
  cors: [serverURL, frontendURL],
  csrf: [serverURL, frontendURL],
  db: postgresAdapter({
    pool: {
      connectionString: databaseUrl,
      connectionTimeoutMillis: databaseConnectionTimeoutMs,
      idleTimeoutMillis: databaseIdleTimeoutMs,
      max: databasePoolMax,
      query_timeout: databaseQueryTimeoutMs,
      statement_timeout: databaseQueryTimeoutMs,
    },
    // Isolate Payload tables from any other app sharing the database.
    schemaName: process.env.PAYLOAD_DB_SCHEMA || 'payload',
    // Phase 1 bootstrap: auto-create / sync the schema on every boot. Payload
    // defaults `push` to false in production, which means a fresh database
    // boots into "relation 'payload.users' does not exist" until migrations
    // have been run. Toggle via `PAYLOAD_DB_PUSH=false` once migrations are
    // wired up (Phase 4+); leave on for now so the schema stays in sync as
    // collections evolve.
    push: process.env.PAYLOAD_DB_PUSH !== 'false',
  }),
  editor: lexicalEditor(),
  globals: [SiteSettings],
  secret: payloadSecret || 'dev-only-insecure-secret',
  serverURL,
  typescript: {
    declare: false,
    outputFile: path.resolve(dirname, '../../packages/types/src/payload.ts'),
  },
})
