import nextConfig from '../../packages/config/eslint/next.mjs'

export default [
  // public/past-present-future is a built SvelteKit export vendored from
  // another project; its minified bundles are not ours to lint.
  { ignores: ['next-env.d.ts', 'public/past-present-future/**'] },
  ...nextConfig,
]
