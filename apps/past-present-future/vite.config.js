import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// apps/web proxies /past-present-future to this port in dev (next.config.mjs).
	// The proxy does not carry the HMR websocket, so the client connects here directly.
	server: {
		port: 3006,
		strictPort: true,
		hmr: { clientPort: 3006 }
	}
});
