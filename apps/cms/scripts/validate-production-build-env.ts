const missing: string[] = []

if (!process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY) {
  missing.push('NEXT_SERVER_ACTIONS_ENCRYPTION_KEY')
}

if (!process.env.VERCEL_GIT_COMMIT_SHA && !process.env.DEPLOYMENT_VERSION) {
  missing.push('DEPLOYMENT_VERSION or VERCEL_GIT_COMMIT_SHA')
}

if (missing.length > 0) {
  console.error(
    `CMS production builds require ${missing.join(
      ', '
    )}. These values keep Next Server Actions stable across deployments.`
  )
  process.exit(1)
}
