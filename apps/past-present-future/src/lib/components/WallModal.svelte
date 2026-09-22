<script>
	import { expoOut, cubicOut } from 'svelte/easing';

	
	let { data = null, onclose = () => {} } = $props();

	const FOCUSABLE =
		'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

	let root = $state(null);
	let closeBtn = $state(null);
	let closing = $state(false);
	let playing = $state({});

	let returnFocus = null;
	let inerted = [];
	let pageY = 0;
	let bodyStyle = null;

	
	const blocks = $derived.by(() => {
		if (!data) return [];
		const paras = data.paras || [];
		const films = data.films || [];
		const out = [];
		paras.forEach((p, n) => {
			out.push({ kind: 'p', html: p });
			const last = n === paras.length - 1;
			films
				.filter((f) => f.after === n + 1 || (last && f.after > n + 1))
				.forEach((f) => out.push({ kind: 'film', film: f }));
		});
		return out;
	});

	
	function inertOutside(dialog) {
		const marked = [];
		for (let node = dialog; node && node !== document.body; node = node.parentElement) {
			for (const sib of node.parentElement.children) {
				if (sib !== node && !sib.inert) {
					sib.inert = true;
					marked.push(sib);
				}
			}
		}
		return marked;
	}

	function trapTab(e) {
		if (e.key !== 'Tab') return;
		const items = [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
		if (!items.length) return;
		const first = items[0];
		const last = items[items.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	$effect(() => {
		if (!data) return;
		playing = {};
		
		pageY = window.scrollY;
		const b = document.body;
		bodyStyle = {
			position: b.style.position,
			top: b.style.top,
			left: b.style.left,
			right: b.style.right,
			width: b.style.width,
			paddingRight: b.style.paddingRight
		};

		const gutter = window.innerWidth - document.documentElement.clientWidth;
		b.style.position = 'fixed';
		b.style.top = `-${pageY}px`;
		b.style.left = '0';
		b.style.right = '0';
		b.style.width = '100%';
		if (gutter > 0) b.style.paddingRight = `${gutter}px`;
		returnFocus = document.activeElement;
		inerted = inertOutside(root);
		const el = root;
		el.addEventListener('keydown', trapTab);
		closeBtn?.focus({ preventScroll: true });

		return () => {
			const html = document.documentElement;
			Object.assign(document.body.style, bodyStyle);
			
			const prev = html.style.scrollBehavior;
			html.style.scrollBehavior = 'auto';
			window.scrollTo(0, pageY);
			html.style.scrollBehavior = prev;
			el.removeEventListener('keydown', trapTab);
			inerted.forEach((n) => {
				n.inert = false;
			});
			inerted = [];
			if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
			returnFocus = null;
		};
	});

	const still = () =>
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	
	function veil(node, { duration = 420 } = {}) {
		const d = still() ? 0 : duration;
		return {
			duration: d,
			easing: cubicOut,
			css: (t) =>
				`opacity:${t}; backdrop-filter:blur(${(10 * t).toFixed(2)}px); -webkit-backdrop-filter:blur(${(10 * t).toFixed(2)}px)`
		};
	}

	function frame(node, { duration = 560, y = 30, from = 0.955 } = {}) {
		const d = still() ? 0 : duration;
		return {
			duration: d,
			easing: expoOut,
			css: (t, u) =>
				`opacity:${Math.min(1, t * 1.7)}; transform:translateY(${(u * y).toFixed(2)}px) scale(${(from + (1 - from) * t).toFixed(4)})`
		};
	}
</script>

{#snippet film(f, i = null)}
	<figure class="wm-film" style={i === null ? null : `--i:${i}`}>
		{#if playing[f.id]}
			<iframe
				src="https://www.youtube.com/embed/{f.id}?autoplay=1&rel=0"
				title={f.cap}
				allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
				allowfullscreen
				loading="lazy"
			></iframe>
		{:else}
			
			<button
				class="wm-film-play"
				type="button"
				aria-label="Play footage: {f.cap}"
				onclick={() => (playing = { ...playing, [f.id]: true })}
			>
				<img src="/past-present-future/museum/video/{f.poster || f.id}.webp" alt="" loading="lazy" width="1280" height="720" />
				<span class="wm-film-cue" aria-hidden="true"></span>
			</button>
		{/if}
		<figcaption>{f.cap} <span class="src">{f.src}</span></figcaption>
	</figure>
{/snippet}

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && data) onclose();
	}}
/>

{#if data}
	<div
		class="wallmodal"
		class:closing
		bind:this={root}
		data-c={data.c}
		role="dialog"
		aria-modal="true"
		aria-labelledby="wm-title"
		onoutrostart={() => (closing = true)}
		onintrostart={() => (closing = false)}
	>
		<button
			class="wm-back"
			type="button"
			tabindex="-1"
			aria-hidden="true"
			onclick={onclose}
			transition:veil
		></button>

		<div class="wm-frame" in:frame out:frame={{ duration: 320, y: 16, from: 0.985 }}>
			<div class="wm-head">
				<span>{data.cat}</span>
				<button class="wm-close" type="button" bind:this={closeBtn} onclick={onclose}>
					Close <span class="x" aria-hidden="true">&times;</span>
				</button>
			</div>

			<div class="wm-scroll">
				<h3 class="wm-title" id="wm-title">{data.title}</h3>
				<div class="wm-hall">{data.hall}</div>
				<div class="wm-body">
					{#each blocks as b, i (i)}
						{#if b.kind === 'p'}
							<p style="--i:{i}">{@html b.html}</p>
						{:else}
							{@render film(b.film, i)}
						{/if}
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	
	.wallmodal {
		--trgb: 201, 142, 98;
	}
	.wallmodal[data-c='s'] {
		--trgb: 198, 235, 247;
	}
	.wallmodal[data-c='c'] {
		--trgb: 255, 211, 40;
	}
	.wallmodal[data-c='d'] {
		--trgb: 161, 136, 99;
	}
	.wallmodal[data-c='g'] {
		--trgb: 95, 121, 124;
	}
	.wallmodal[data-c='i'] {
		--trgb: 226, 224, 201;
	}

	.wallmodal {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(16px, 3vw, 48px);
	}
	
	.wallmodal.closing {
		pointer-events: none;
	}

	.wm-back {
		position: absolute;
		inset: 0;
		border: 0;
		padding: 0;
		background: rgba(0, 0, 0, 0.82);
		cursor: pointer;
	}

	.wm-frame {
		position: relative;
		width: min(860px, 100%);
		max-height: min(86vh, 86svh);
		display: flex;
		flex-direction: column;
		border: 1px solid rgba(var(--trgb), 0.7);
		background:
			radial-gradient(circle 3px at 15px 15px, rgba(var(--trgb), 0.95) 1.6px, rgba(var(--trgb), 0) 3px),
			radial-gradient(
				circle 3px at calc(100% - 15px) 15px,
				rgba(var(--trgb), 0.95) 1.6px,
				rgba(var(--trgb), 0) 3px
			),
			radial-gradient(
				circle 3px at 15px calc(100% - 15px),
				rgba(var(--trgb), 0.95) 1.6px,
				rgba(var(--trgb), 0) 3px
			),
			radial-gradient(
				circle 3px at calc(100% - 15px) calc(100% - 15px),
				rgba(var(--trgb), 0.95) 1.6px,
				rgba(var(--trgb), 0) 3px
			),
			linear-gradient(
				158deg,
				rgba(var(--trgb), 0.07) 0%,
				rgba(var(--trgb), 0.02) 40%,
				rgba(var(--trgb), 0.05) 100%
			),
			linear-gradient(#0b0908, #0b0908);
		box-shadow: 0 40px 120px rgba(0, 0, 0, 0.8);
	}

	.wm-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 18px;
		padding: clamp(20px, 2.6vw, 30px) clamp(24px, 3.4vw, 48px) 16px;
		border-bottom: 1px solid rgba(var(--trgb), 0.45);
		font-size: 9.5px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: rgba(var(--trgb), 0.95);
	}
	.wm-close {
		background: none;
		border: none;
		cursor: pointer;
		font-family: 'Fira Code', ui-monospace, monospace;
		font-size: 9.5px;
		letter-spacing: .2em;
		text-transform: uppercase;
		color: rgba(var(--trgb), 0.95);
		display: inline-flex;
		gap: 8px;
		align-items: center;
		
		min-height: 44px;
		padding: 0 4px;
	}
	.wm-close .x {
		font-size: 1.9em;
		line-height: 0;
		
		transform: translateY(-0.083em);
	}
	.wm-close:hover {
		color: var(--ink);
	}

	.wm-scroll {
		overflow-y: auto;
		padding: clamp(24px, 3.4vw, 48px);
		scrollbar-width: thin;
	}
	.wm-title {
		font-family: 'Rhymes Display', serif;
		font-weight: 400;
		font-size: clamp(28px, 4vw, 46px);
		line-height: 1;
		letter-spacing: 0;
		margin: 0 0 6px;
	}
	.wm-hall {
		font-size: 10px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: 26px;
	}
	.wm-body p {
		font-family: 'Fira Code', ui-monospace, monospace;
		font-weight: 300;
		font-size: clamp(12.5px, 1.15vw, 14.5px);
		line-height: 1.75;
		color: #fff;
		margin: 0 0 1.35em;
	}
	
	.wm-body :global(.num) {
		color: rgba(var(--trgb), 0.95);
	}

	
	.wm-film {
		margin: 44px 0;
	}
	.wm-film-play {
		display: block;
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		padding: 0;
		border: 1px solid var(--line);
		background: #000;
		cursor: pointer;
		overflow: hidden;
	}
	.wm-film-play img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		filter: saturate(0.72) contrast(1.04);
		transition:
			filter 0.5s ease,
			transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.wm-film-play:hover img {
		filter: saturate(0.95) contrast(1);
		transform: scale(1.02);
	}
	
	.wm-film-cue {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 64px;
		height: 64px;
		margin: -32px 0 0 -32px;
		border: 1px solid rgba(255, 255, 255, 0.85);
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.35);
		backdrop-filter: blur(2px);
		transition:
			background 0.3s ease,
			border-color 0.3s ease;
	}
	.wm-film-cue::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		margin: -8px 0 0 -4px;
		border-left: 13px solid #fff;
		border-top: 8px solid transparent;
		border-bottom: 8px solid transparent;
	}
	.wm-film-play:hover .wm-film-cue {
		background: rgba(0, 0, 0, 0.6);
		border-color: #fff;
	}
	.wm-film-play:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 3px;
	}
	.wm-film iframe {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 9;
		border: 1px solid var(--line);
	}
	.wm-film figcaption {
		margin-top: 10px;
		font-family: 'Fira Code', ui-monospace, monospace;
		font-weight: 300;
		font-size: 11px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--faint);
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	.wm-film figcaption .src {
		color: rgba(var(--trgb), 0.9);
	}
	.wm-film figcaption .src::before {
		content: '·';
		margin-right: 10px;
		color: var(--faint);
	}

	
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.wm-head,
	.wm-title,
	.wm-hall,
	.wm-body > :global(*) {
		animation: rise 0.62s cubic-bezier(0.16, 1, 0.3, 1) backwards;
	}
	.wm-head {
		animation-delay: 0.14s;
	}
	.wm-title {
		animation-delay: 0.22s;
	}
	.wm-hall {
		animation-delay: 0.29s;
	}
	.wm-body > :global(*) {
		
		animation-delay: min(calc(0.34s + var(--i, 0) * 0.05s), 0.72s);
	}

	@media (max-width: 680px) {
		.wm-film {
			margin: 32px 0;
		}
		.wm-film-cue {
			width: 52px;
			height: 52px;
			margin: -26px 0 0 -26px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wm-head,
		.wm-title,
		.wm-hall,
		.wm-body > :global(*) {
			animation: none;
		}
		.wm-film-play img,
		.wm-film-cue {
			transition: none;
		}
	}
</style>
