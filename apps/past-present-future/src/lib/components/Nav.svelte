<script>
	import { navBridge } from '$lib/nav-bridge.svelte.js';
	import { scramble } from '$lib/actions/scramble.js';
	import { LOGO_SVG } from '$lib/choices/logo.js';

	
	let open = $state(false);

	
	let { chapters = true } = $props();

	
	const CHAPTERS = [
		{ lead: 'Explore the ', word: 'Past', nav: 'past' },
		{ lead: 'Understand the ', word: 'Present', nav: 'present' },
		{ lead: 'Discover the ', word: 'Future', nav: 'future' }
	];

	
	function markClick(e) {
		if (navBridge.onHome) {
			e.preventDefault();
			navBridge.onHome();
		}
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') open = false;
	}}
	onclick={(e) => {
		if (open && !e.target.closest('.topnav') && !e.target.closest('.nav-sheet')) open = false;
	}}
/>

<nav class="topnav" class:open aria-label="Past Present Future">
	<a class="nav-mark" href="/past-present-future/" data-sveltekit-reload aria-label="Logos" onclick={markClick}>
		{@html LOGO_SVG}
	</a>

	{#if chapters}
	<div class="nav-menu">
		<div
			class="nav-pill"
			style:opacity={navBridge.pillOpacity}
			style:pointer-events={navBridge.pillEvents}
		>
			
			{#each CHAPTERS as c}
				<button
					class="nav-item"
					type="button"
					use:scramble
					onclick={() => navBridge.onNav?.(c.nav)}><span class="lg">{c.lead}</span>{c.word}</button
				>
			{/each}
		</div>

		<button
			class="nav-burger"
			type="button"
			aria-expanded={open}
			aria-controls="navSheet"
			aria-label={open ? 'Close menu' : 'Open menu'}
			onclick={() => (open = !open)}
		>
			<span class:x={open}></span>
			<span class:x={open}></span>
		</button>
	</div>

	{/if}

	<div class="nav-right"></div>
</nav>

{#if chapters}

<div class="nav-sheet" id="navSheet" class:open inert={!open}>
	<div class="nav-sheet-inner">
		{#each CHAPTERS as c}
			<button class="sheet-item"
				type="button"
				onclick={() => {
					open = false;
					navBridge.onNav?.(c.nav);
				}}
				>{c.lead}{c.word}</button
			>
		{/each}
	</div>
</div>
{/if}

<style>
	.topnav,
	.nav-sheet {
		--nav-pad: clamp(16px, 2.6vw, 30px);
	}

	.topnav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 120;
		height: 58px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 var(--nav-pad);
		pointer-events: none;
		background: transparent;
		transition: background 0.35s cubic-bezier(0.16, 1, 0.3, 1);
	}
	
	.topnav.open {
		background: #000;
	}
	.topnav > :global(*) {
		pointer-events: auto;
	}

	.nav-mark {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 30px;
		line-height: 0;
		position: relative;
	}
	
	.nav-mark::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 44px;
		height: 44px;
		transform: translate(-50%, -50%);
	}
	.nav-mark :global(svg) {
		width: auto;
		height: 26px;
		fill: #ffffff;
		display: block;
	}

	.nav-right {
		display: flex;
		align-items: stretch;
		gap: 10px;
	}

	.nav-pill {
		display: flex;
		align-items: stretch;
		border: 1px solid rgba(255, 255, 255, 0.45);
		border-radius: 100px;
		
		overflow: hidden;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	.nav-item {
		font-family: 'Fira Code', ui-monospace, monospace;
		font-size: 11px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #ffffff;
		background: none;
		border: 0;
		border-left: 1px solid rgba(255, 255, 255, 0.26);
		cursor: pointer;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		white-space: nowrap;
		padding: 10px clamp(13px, 1.4vw, 20px);
		transition: background 0.25s ease;
	}
	.nav-item:first-child {
		border-left: 0;
	}
	.nav-item:hover {
		background: rgba(255, 255, 255, 0.16);
	}

	
	@media (max-width: 1080px) {
		.nav-item .lg {
			display: none;
		}
	}
	
	.nav-burger {
		display: none;
		flex-direction: column;
		justify-content: center;
		gap: 5px;
		width: 40px;
		height: 40px;
		padding: 0 8px;
		background: none;
		border: 0;
		cursor: pointer;
	}
	.nav-burger span {
		display: block;
		height: 1px;
		width: 100%;
		background: #fff;
		transition:
			transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
			opacity 0.2s ease;
	}
	.nav-burger span.x:first-child {
		transform: translateY(3px) rotate(45deg);
	}
	.nav-burger span.x:last-child {
		transform: translateY(-3px) rotate(-45deg);
	}

	.nav-sheet {
		display: none;
		position: fixed;
		top: 52px;
		left: 0;
		right: 0;
		z-index: 119;
		background: #000;
		
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.42s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.nav-sheet.open {
		grid-template-rows: 1fr;
	}
	.nav-sheet-inner {
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
	}
	
	.sheet-item {
		opacity: 0;
		translate: 0 -10px;
		transition:
			opacity 0.3s ease,
			translate 0.42s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.nav-sheet.open .sheet-item {
		opacity: 1;
		translate: 0 0;
	}
	.nav-sheet.open .sheet-item:nth-child(1) {
		transition-delay: 0.08s;
	}
	.nav-sheet.open .sheet-item:nth-child(2) {
		transition-delay: 0.15s;
	}
	.nav-sheet.open .sheet-item:nth-child(3) {
		transition-delay: 0.22s;
	}
	.sheet-item {
		font-family: 'Fira Code', ui-monospace, monospace;
		font-size: 12px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #fff;
		
		background: none;
		border: 0;
		appearance: none;
		-webkit-appearance: none;
		cursor: pointer;
		padding: 18px var(--nav-pad);
		border-top: 1px solid rgba(255, 255, 255, 0.14);
	}
	.sheet-item:first-child {
		border-top: 0;
	}

	@media (max-width: 680px) {
		.topnav,
		.nav-sheet {
			--nav-pad: 12px;
		}
		.topnav {
			height: 52px;
		}
		.nav-mark :global(svg) {
			height: 22px;
		}
		
		.nav-pill {
			display: none;
		}
		.nav-burger {
			display: flex;
		}
		.nav-menu {
			margin-left: auto;
		}
		.nav-right {
			display: none;
		}
		.nav-sheet {
			display: grid;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-sheet,
		.nav-burger span {
			transition: none;
		}
	}
</style>
