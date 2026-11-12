import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

import { resolveDevPayloadSecret } from './dev-payload-secret'
import {
  createAutoSubmitState,
  isLocalSchemaPushAutomationAllowed,
  shouldSubmitDefaultSchemaChoice,
} from './schema-push-prompts'

if (!isLocalSchemaPushAutomationAllowed(process.env)) {
  console.error(
    [
      'Refusing to run the CMS dev schema-push wrapper in a deployment environment.',
      'Production and staging must use the build/start path with reviewed migrations, not local dev schema sync.',
    ].join(' ')
  )
  process.exit(1)
}

interface NextEnv {
  loadEnvConfig: (dir: string, dev?: boolean) => unknown
}

// Load apps/cms/.env* the same way `next dev` will, so a configured
// PAYLOAD_SECRET is detected before deciding to generate one. Only the
// original environment is forwarded, so Next still owns .env reloading.
const childEnv = { ...process.env }
const require = createRequire(import.meta.url)
const { loadEnvConfig } = require('@next/env') as NextEnv
loadEnvConfig(process.cwd(), true)

const payloadSecret = resolveDevPayloadSecret(process.env.PAYLOAD_SECRET)
if (payloadSecret.generated) {
  console.warn(
    'PAYLOAD_SECRET is unset; using a random secret for this dev run. Sessions reset on restart.'
  )
  childEnv.PAYLOAD_SECRET = payloadSecret.secret
}

const child = spawn('next', ['dev', '--port', '3001'], {
  env: childEnv,
  stdio: ['pipe', 'pipe', 'pipe'],
})

const state = createAutoSubmitState()
let recentOutput = ''

const handleOutput = (chunk: Buffer, stream: NodeJS.WriteStream): void => {
  const output = chunk.toString()
  stream.write(chunk)

  recentOutput = `${recentOutput}${output}`.slice(-4000)

  if (shouldSubmitDefaultSchemaChoice(recentOutput, state)) {
    child.stdin.write('\n')
  }
}

child.stdout.on('data', (chunk: Buffer) => {
  handleOutput(chunk, process.stdout)
})

child.stderr.on('data', (chunk: Buffer) => {
  handleOutput(chunk, process.stderr)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})

const forwardSignal = (signal: NodeJS.Signals): void => {
  child.kill(signal)
}

process.on('SIGINT', forwardSignal)
process.on('SIGTERM', forwardSignal)
