<script>
	import { goto } from '$app/navigation';

	let { guard = () => false } = $props();

	let activeFace = $state(-1);
	const isMobile = () => window.matchMedia('(max-width: 760px)').matches;
	function faceTap(e, i) {
		if (guard()) {
			e.preventDefault();
			return;
		}
		if (!isMobile()) {
			if (i === 0) {
				e.preventDefault();
				goto('/past-present-future/choices/mike');
			}
			return;
		}
		e.preventDefault();
		if (i === 0 && activeFace === 0 && e.target.closest('.face-go')) {
			goto('/past-present-future/choices/mike');
			return;
		}
		activeFace = i;
	}
</script>

<div class="select choices-scope">
	<div class="faces" class:has-active={activeFace >= 0}>
		<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
		<div class="face" class:active={activeFace === 0} onclick={(e) => faceTap(e, 0)}>
			<div class="face-img" style="background-image:url('/past-present-future/choices/faces/michael.webp')"></div>
			<div class="face-body">
				<div class="face-name">Mike</div>
				<div class="face-path">The Debt Path</div>
				<div class="face-go">▶ Live his life</div>
			</div>
		</div>
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

	<div class="hero">
		<div class="kick">Experience the Present</div>
		<h1>Life’s Choices</h1>
		<div class="sub">Six life choices starting as a UK student. <span class="sub-b">Choose a life to live.</span></div>
	</div>
</div>

<style>
	.select {
		position: absolute;
		inset: 0;
		z-index: 3;
		background: var(--ink, #070908);
		font-family: var(--sans);
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
		cursor: pointer;
		color: var(--paper);
		background: #0a0c0b;
		transition: flex 0.6s cubic-bezier(0.16, 1, 0.3, 1);
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
		font-size: clamp(24px, 2.4vw, 38px);
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

	.hero {
		position: absolute;
		top: 13%;
		left: 0;
		right: 0;
		z-index: 30;
		text-align: center;
		padding: 0 6vw;
		pointer-events: none;
	}
	.hero .kick {
		font-family: 'Fira Code', monospace;
		font-weight: 465;
		font-size: 13.2px;
		letter-spacing: 0.01em;
		line-height: 0.92;
		text-transform: uppercase;
		color: #fff;
	}
	.hero h1 {
		font-family: var(--display);
		font-weight: 400;
		font-size: clamp(39.5px, 5.47vw, 94.7px);
		line-height: 0.94;
		letter-spacing: -0.03em;
		margin-top: 10px;
		color: #fff;
	}
	.hero .sub {
		font-family:
			'Public Sans',
			system-ui,
			-apple-system,
			sans-serif;
		font-weight: 400;
		font-size: clamp(15.6px, calc(0.92vw + 4px), 16.9px);
		line-height: 1.25;
		color: #fff;
		max-width: 60ch;
		margin: clamp(14px, 1.85vh, 23px) auto 0;
	}

	@media (max-width: 760px) {
		.select {
			display: flex;
			flex-direction: column;
		}
		.hero {
			position: static;
			order: -1;
			padding: 44px 6vw 26px;
		}
		.hero h1 {
			font-size: clamp(32.3px, 9.78vw, 58.7px);
		}
		.hero .sub {
			font-size: 14px;
			line-height: 1.35;
			margin-top: 10px;
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
			transition:
				opacity 0.35s ease,
				transform 0.35s ease,
				max-height 0.45s cubic-bezier(0.16, 1, 0.3, 1),
				margin-top 0.45s cubic-bezier(0.16, 1, 0.3, 1),
				padding 0.45s cubic-bezier(0.16, 1, 0.3, 1);
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
</style>
