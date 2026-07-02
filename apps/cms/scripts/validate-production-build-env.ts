const missing: string[] = []

if (!process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY) {
  missing.push('NEXT_SERVER_ACTIONS_ENCRYPTION_KEY')
}

if (
  !process.env.DEPLOYMENT_VERSION &&
  !process.env.NEXT_DEPLOYMENT_ID &&
  !process.env.VERCEL_GIT_COMMIT_SHA
) {
  missing.push(
    'DEPLOYMENT_VERSION, NEXT_DEPLOYMENT_ID, or VERCEL_GIT_COMMIT_SHA'
  )
}

if (missing.length > 0) {
  console.error(
    `CMS production builds require ${missing.join(
      ', '
    )}. These values keep Next Server Actions stable across deployments.`
  )
  process.exit(1)
}
