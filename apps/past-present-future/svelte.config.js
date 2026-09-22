import adapter from '@sveltejs/adapter-static';

// Every route is prerendered (see src/routes/+layout.js). The static output in
// build/ is copied into the web app's export at out/past-present-future by
// apps/web/scripts/copy-past-present-future.sh.
//
// The output dirs are set explicitly because adapter-static otherwise detects
// Vercel (VERCEL=1) and writes to .vercel/output/static instead of build/.
const config = {
	kit: {
		adapter: adapter({ pages: 'build', assets: 'build' }),
		paths: {
			base: '/past-present-future',
			relative: false
		}
	}
};

export default config;
