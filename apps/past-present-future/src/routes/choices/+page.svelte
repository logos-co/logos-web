<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { navBridge } from '$lib/nav-bridge.svelte.js';

	let activeFace = $state(-1);
	const isMobile = () => window.matchMedia('(max-width: 760px)').matches;
	function faceTap(e, i) {
		if (!isMobile()) return;
		if (i === 0 && activeFace === 0 && e.target.closest('.face-go')) return;
		e.preventDefault();
		activeFace = i;
	}

	onMount(() => {
		document.body.classList.add('choices');

		navBridge.onNav = (era) => {
			if (era === 'past') goto('/past-present-future/museum-of-civil-liberties');
			else if (era === 'present') goto('/past-present-future/choices');
			else if (era === 'future') goto('/past-present-future/?to=future');
		};

		return () => {
			document.body.classList.remove('choices');
			navBridge.onNav = null;
		};
	});
</script>

<svelte:head>
	<title>Life’s Choices · Experience the Present</title>
	<meta
		name="description"
		content="Every life choice. The system works against you. Three interactive films. Choose a life to live."
	/>
</svelte:head>

<div id="shell" class="choices-scope">
	<div class="faces" class:has-active={activeFace >= 0}>
		<a class="face" class:active={activeFace === 0} href="/past-present-future/choices/mike" onclick={(e) => faceTap(e, 0)}>
			<div class="face-img" style="background-image:url('/past-present-future/choices/faces/michael.webp')"></div>
			<div class="face-body">
				<div class="face-name">Mike</div>
				<div class="face-path">The Debt Path</div>
				<div class="face-go">▶ Live his life</div>
			</div>
		</a>
		<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
		<div class="face soon" class:active={activeFace === 1} onclick={(e) => faceTap(e, 1)}>
			<div class="face-img" style="background-image:url('/past-present-future/choices/faces/amanda.webp')"></div>
			<div class="face-body">
				<div class="face-name">Amanda</div>
				<div class="face-path">The Watched Path</div>
				<div class="face-go">Coming soon</div>
			</div>
		</div>
		<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
		<div class="face soon" class:active={activeFace === 2} onclick={(e) => faceTap(e, 2)}>
			<div class="face-img" style="background-image:url('/past-present-future/choices/faces/richard.webp')"></div>
			<div class="face-body">
				<div class="face-name">Nedo</div>
				<div class="face-path">The Rigged Path</div>
				<div class="face-go">Coming soon</div>
			</div>
		</div>
	</div>

	<div class="veil-bot" aria-hidden="true"></div>
	<div class="veil-top" aria-hidden="true"></div>
	<div class="grain grain-fx" aria-hidden="true"></div>

	<div class="hero">
		<div class="kick">Experience the Present</div>
		<h1>Life’s Choices</h1>
		<div class="sub">Six life choices starting as a UK student. <span class="sub-b">Choose a life to live.</span></div>
	</div>

	<div class="frame" aria-hidden="true"></div>
</div>

<style>
	:global(body.choices) {
		background: #e2e0c9;
		overflow: hidden;
	}

	#shell {
		--ink: #0b0d0c;
		position: fixed;
		inset: 14px;
		z-index: 0;
		background: #070908;
		border-radius: 40px;
		overflow: hidden;
		clip-path: inset(0 round 40px);
		height: calc(100dvh - 28px);
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
		color: var(--paper);
		font-family: var(--sans);
		-webkit-font-smoothing: antialiased;
	}
	.frame {
		position: absolute;
		inset: 0;
		z-index: 50;
		pointer-events: none;
		border-radius: 40px;
		border: 1px solid rgba(236, 236, 228, 0.1);
	}
	@media (max-width: 640px) {
		#shell {
			inset: 8px;
			border-radius: 26px;
			clip-path: inset(0 round 26px);
			height: calc(100dvh - 16px);
		}
		.frame {
			border-radius: 26px;
		}
	}

	.faces {
		position: absolute;
		inset: 0;
		z-index: 10;
		display: flex;
		gap: 4px;
	}
	.face {
		position: relative;
		flex: 1;
		min-width: 0;
		display: block;
		overflow: hidden;
		text-decoration: none;
		color: var(--paper);
		background: #0a0c0b;
		transition: flex 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		animation: fade 1.2s ease both;
	}
	.face:nth-child(1) {
		animation-delay: 0.12s;
	}
	.face:nth-child(2) {
		animation-delay: 0.26s;
	}
	.face:nth-child(3) {
		animation-delay: 0.4s;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.face-img {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: 50% 40%;
		filter: grayscale(1) brightness(0.4) contrast(1.05);
		transform: scale(1.05);
		transition:
			filter 0.7s ease,
			transform 1s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.face:hover .face-img {
		filter: grayscale(0) brightness(0.74) contrast(1);
		transform: scale(1.1);
	}
	@media (min-width: 761px) {
		.faces:hover .face {
			flex: 0.82;
		}
		.faces:hover .face:hover {
			flex: 1.4;
		}
	}
	@media (max-width: 760px) {
		#shell {
			display: flex;
			flex-direction: column;
		}
		#shell .hero {
			position: static;
			order: -1;
			padding: 44px 6vw 26px;
		}
		.hero .sub .sub-b {
			display: block;
		}
		.faces {
			position: relative;
			inset: auto;
			flex: 1;
			min-height: 0;
			flex-direction: column;
			gap: 3px;
		}
		.face {
			transition: flex-grow 0.55s cubic-bezier(0.16, 1, 0.3, 1);
		}
		.faces.has-active .face.active {
			flex-grow: 1.7;
		}
		.faces.has-active .face:not(.active) {
			flex-grow: 0.72;
		}
		.face-body {
			transform: none;
		}
		.face .face-go {
			margin-top: 0;
			max-height: 0;
			padding-top: 0;
			padding-bottom: 0;
			border-width: 0;
			overflow: hidden;
			opacity: 0;
			transform: translateY(8px);
			transition: opacity 0.35s ease, transform 0.35s ease, max-height 0.45s cubic-bezier(0.16, 1, 0.3, 1),
				margin-top 0.45s cubic-bezier(0.16, 1, 0.3, 1), padding 0.45s cubic-bezier(0.16, 1, 0.3, 1);
		}
		.face.active .face-go {
			margin-top: 16px;
			max-height: 48px;
			padding-top: 12px;
			padding-bottom: 12px;
			border-width: 1px;
			opacity: 1;
			transform: none;
		}
		.faces.has-active .face:not(.active) .face-path {
			opacity: 0.4;
		}
		.face-path {
			margin-top: 10px;
			transition: opacity 0.35s ease;
		}
	}

	.face-body {
		position: absolute;
		inset: 0;
		z-index: 3;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 0 8%;
		transform: translateY(9%);
	}
	.face-name {
		font-family: var(--display);
		font-weight: 400;
		font-size: clamp(26px, 2.8vw, 44px);
		line-height: 1;
		letter-spacing: -0.01em;
		color: var(--signal);
		text-shadow: 0 2px 30px rgba(0, 0, 0, 0.85);
	}
	.face-path {
		font-family: var(--code);
		font-size: 10.5px;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: rgba(236, 236, 228, 0.62);
		margin-top: 14px;
	}
	.face-go {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		margin-top: 24px;
		border: 1px solid rgba(245, 245, 239, 0.6);
		border-radius: 100px;
		background: rgba(245, 245, 239, 0.06);
		color: var(--signal);
		font-family: var(--code);
		font-size: 10.5px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		padding: 12px 24px;
		-webkit-backdrop-filter: blur(2px);
		backdrop-filter: blur(2px);
		opacity: 0;
		transform: translateY(8px);
		transition:
			opacity 0.35s ease,
			transform 0.35s ease,
			background 0.25s ease,
			color 0.25s ease;
	}
	.face:hover .face-go {
		opacity: 1;
		transform: none;
		background: var(--signal);
		color: var(--ink);
		border-color: var(--signal);
	}
	.face.soon {
		cursor: default;
	}
	.face.soon:hover .face-go {
		background: rgba(245, 245, 239, 0.06);
		color: rgba(236, 236, 228, 0.7);
		border-color: rgba(245, 245, 239, 0.35);
	}

	.veil-top {
		position: absolute;
		inset: 0;
		z-index: 20;
		pointer-events: none;
		background: linear-gradient(
			to bottom,
			rgba(6, 8, 7, 0.9) 0%,
			rgba(6, 8, 7, 0.55) 20%,
			rgba(6, 8, 7, 0.08) 40%,
			transparent 52%
		);
	}
	.veil-bot {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 42%;
		z-index: 15;
		pointer-events: none;
		background: linear-gradient(
			to top,
			rgba(6, 8, 7, 0.92) 0%,
			rgba(6, 8, 7, 0.35) 45%,
			transparent 100%
		);
	}
	.grain {
		position: absolute;
		inset: -50%;
		z-index: 35;
		opacity: 0.08;	}

	.hero {
		position: absolute;
		top: 17%;
		left: 0;
		right: 0;
		z-index: 30;
		text-align: center;
		padding: 0 6vw;
		pointer-events: none;
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.hero .kick {
		font-family: var(--code);
		font-size: 11px;
		letter-spacing: 0.4em;
		text-transform: uppercase;
		color: rgba(236, 236, 228, 0.72);
		animation: rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) both 0.1s;
	}
	.hero h1 {
		font-family: var(--display);
		font-weight: 400;
		font-size: clamp(44px, 7.5vw, 104px);
		line-height: 0.92;
		letter-spacing: -0.02em;
		margin-top: 14px;
		text-shadow: 0 4px 40px rgba(0, 0, 0, 0.7);
		animation: rise 1.1s cubic-bezier(0.16, 1, 0.3, 1) both 0.22s;
		color: var(--signal);
	}
	.hero .sub {
		font-family: var(--sans);
		font-size: clamp(13px, 1.15vw, 15px);
		line-height: 1.6;
		color: rgba(236, 236, 228, 0.82);
		max-width: 520px;
		margin: 16px auto 0;
		text-shadow: 0 2px 18px rgba(0, 0, 0, 0.8);
		animation: rise 1s cubic-bezier(0.16, 1, 0.3, 1) both 0.42s;
	}
	@media (max-width: 760px) {
		.hero {
			top: 12%;
		}
	}
</style>
