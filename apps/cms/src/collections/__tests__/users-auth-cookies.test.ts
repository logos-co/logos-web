import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { test } from 'node:test'
import { promisify } from 'node:util'
import { Users } from '../Users'

const execFileAsync = promisify(execFile)

const readProductionCookies = async (): Promise<{
  sameSite?: string
  secure?: boolean
}> => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      '--import',
      'tsx',
      '-e',
      "const { Users } = await import('./src/collections/Users.ts'); console.log(JSON.stringify(Users.auth?.cookies))",
    ],
    {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'production' },
    }
  )

  return JSON.parse(stdout) as { sameSite?: string; secure?: boolean }
}

test('session cookie is SameSite=Strict', () => {
  assert.equal(typeof Users.auth, 'object')
  const auth = Users.auth as Exclude<typeof Users.auth, boolean | undefined>
  assert.equal(auth.cookies?.sameSite, 'Strict')
  assert.equal(auth.cookies?.secure, false)
})

test('session cookie is Secure in production', async () => {
  const cookies = await readProductionCookies()
  assert.equal(cookies.secure, true)
})
