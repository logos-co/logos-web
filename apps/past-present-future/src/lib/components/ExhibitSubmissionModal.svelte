<script>
	import { tick } from 'svelte';
	import { submitExhibit } from '$lib/museum-submission.js';
	let { open = false, onclose = () => {} } = $props();
	let dialog = $state(null);
	let heading = $state(null);
	const emptyValues = () => ({ name: '', handle: '', exhibition: '', event: '', source: '', website: '' });
	let values = $state(emptyValues());
	let notice = $state('');
	let sending = $state(false);
	let sent = $state(false);

	function closeModal() {
		onclose();
		if (sent) { sent = false; values = emptyValues(); }
	}

	const exhibitions = [
		'Control of Money Exhibition',
		'Surveillance State Exhibition',
		'Censored World Exhibition',
		'Failure of Voice Exhibition',
		'Systems of Control Exhibition'
	];
	const identityFields = [
		{ key: 'name', label: 'Name', help: 'Optional. You can use a pseudonym.', limit: 50 },
		{ key: 'handle', label: 'X handle', help: 'Optional. Used to credit submissions during promotion.', limit: 15 }
	];

	$effect(() => {
		if (!open || !dialog) return;
		const returnFocus = document.activeElement;
		const scrollY = window.scrollY;
		const body = document.body;
		const previous = {
			position: body.style.position,
			top: body.style.top,
			width: body.style.width,
			paddingRight: body.style.paddingRight
		};
		const gutter = window.innerWidth - document.documentElement.clientWidth;
		body.style.position = 'fixed';
		body.style.top = `-${scrollY}px`;
		body.style.width = '100%';
		if (gutter > 0) body.style.paddingRight = `${gutter}px`;
		dialog.showModal();
		heading.parentElement.scrollTop = 0;
		heading.focus({ preventScroll: true });

		return () => {
			dialog.close();
			Object.assign(body.style, previous);
			const html = document.documentElement;
			const behaviour = html.style.scrollBehavior;
			html.style.scrollBehavior = 'auto';
			window.scrollTo(0, scrollY);
			html.style.scrollBehavior = behaviour;
			if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
		};
	});

	function closeOnBackdrop(event) {
		if (event.target !== dialog) return;
		const rect = dialog.getBoundingClientRect();
		if (event.clientX < rect.left || event.clientX > rect.right ||
			event.clientY < rect.top || event.clientY > rect.bottom) closeModal();
	}

	function handleKeydown(event) {
		if (event.key === 'Escape') {
			event.preventDefault();
			closeModal();
		} else if (event.key === 'Tab') {
			const controls = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled):not([tabindex="-1"]), select:not(:disabled), textarea:not(:disabled), a[href]')];
			const first = controls[0];
			const last = controls[controls.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
	}

	function validateSource(event) {
		const input = event.currentTarget;
		let valid = false;
		try {
			valid = ['https:', 'http:'].includes(new URL(input.value).protocol);
		} catch {
			valid = false;
		}
		input.setCustomValidity(input.value && !valid ? 'Enter a full http:// or https:// source URL.' : '');
	}

	async function submit(event) {
		event.preventDefault();
		if (sending) return;
		sending = true;
		notice = '';
		try {
			await submitExhibit({ ...values });
			sent = true;
			await tick();
			heading.focus({ preventScroll: true });
		} catch (error) {
			notice = error instanceof Error && error.message.startsWith('Too many submissions')
				? error.message
				: 'We could not confirm delivery. Your answers have been kept. Please try again later.';
		} finally { sending = false; }
	}
</script>

<dialog
	id="exhibit-submission"
	bind:this={dialog}
	aria-labelledby="submission-title"
	aria-describedby={sent ? 'submission-success' : 'submission-note'}
	onclick={closeOnBackdrop}
	onkeydown={handleKeydown}
	oncancel={(event) => { event.preventDefault(); closeModal(); }}
>
	<div class="submission-head">
		<span>Museum of Civil Liberties</span>
		<button type="button" onclick={closeModal} aria-label="Close submission form">Close</button>
	</div>
	<div class="submission-scroll">
		<h2 id="submission-title" tabindex="-1" bind:this={heading}>{#if sent}Thank you for<br />your submission{:else}Submit an exhibit<br />to the museum{/if}</h2>
		{#if sent}
			<p class="note" id="submission-success" role="status">Your exhibit suggestion has been sent to the museum team for review. We do not guarantee that all submissions will be included in the museum.</p>
			<button class="submit" type="button" onclick={closeModal}>Back to the museum</button>
		{:else}
		<p id="submission-note" class="note">The Museum of Civil Liberties explores historic infringements on civil liberties. Please ensure your submission relates to a past event, not an ongoing one. Additionally, we do not guarantee that all exhibit submissions will be included in the museum.</p>
		<form onsubmit={submit} aria-busy={sending}>
			<fieldset disabled={sending}>
				<div class="honey" aria-hidden="true"><label for="submission-website">Leave this field empty</label><input id="submission-website" type="text" name="website" tabindex="-1" autocomplete="off" bind:value={values.website} /></div>
			<div class="identity-fields">
				{#each identityFields as field}
					<div class="field">
						<label for={'submission-' + field.key}>{field.label} <span class="optional">(optional)</span></label>
						<input id={'submission-' + field.key} name={field.key} type="text" maxlength={field.limit} bind:value={values[field.key]} aria-describedby={'submission-' + field.key + '-help'} />
						<p class="help" id={'submission-' + field.key + '-help'}>{field.help}</p>
					</div>
				{/each}
			</div>
			<div class="field">
				<label for="submission-exhibition">Submitting to <span class="required">(required)</span></label>
				<div class="select-wrap">
					<select id="submission-exhibition" name="exhibition" required bind:value={values.exhibition}>
						<option value="" disabled>Choose the relevant exhibition</option>
						{#each exhibitions as exhibition}<option value={exhibition}>{exhibition}</option>{/each}
					</select>
					<span class="chevron" aria-hidden="true"></span>
				</div>
			</div>
			<div class="field">
				<label for="submission-event">Historic event <span class="required">(required)</span></label>
				<textarea id="submission-event" name="event" rows="4" required maxlength="300" bind:value={values.event} aria-describedby="submission-event-help submission-event-count" oninput={(event) => event.currentTarget.setCustomValidity(event.currentTarget.value.trim() ? '' : 'Describe the historic event, including its date or year.')}></textarea>
				<div class="field-meta">
					<p class="help" id="submission-event-help">Briefly describe the historic event, including its date or year.</p>
					<span class="counter" id="submission-event-count">{values.event.length}/300</span>
				</div>
			</div>
			<div class="field">
				<label for="submission-source">Primary source URL <span class="required">(required)</span></label>
				<input id="submission-source" name="source" type="url" required maxlength="100" placeholder="https://" bind:value={values.source} aria-describedby="submission-source-help submission-source-count" oninput={validateSource} />
				<div class="field-meta">
					<p class="help" id="submission-source-help">Include a URL to the most relevant primary source related to your submission.</p>
					<span class="counter" id="submission-source-count">{values.source.length}/100</span>
				</div>
				<p class="example">For example, "The Russian SWIFT Exclusions" exhibit uses "Council Regulation (EU) 2022/345. 1 March 2022." <a href="https://eur-lex.europa.eu/eli/reg/2022/345/oj/eng" target="_blank" rel="noreferrer">View primary source</a></p>
			</div>
			<div class="submission-actions">
				<button class="submit" type="submit" disabled={sending}>{sending ? 'Sending...' : 'Submit exhibit'}</button>
				<p class="notice" role="status">{notice}</p>
			</div>
			</fieldset>
		</form>
		{/if}
	</div>
</dialog>

<style>
	dialog {
		--metal: #a18863;
		color: #fff;
		background: linear-gradient(158deg, #16130f, #0b0908 45%, #12100d);
		border: 1px solid var(--metal);
		box-shadow: 0 40px 120px #000c;
		padding: 0;
		margin: auto;
		width: min(760px, calc(100% - 32px));
		max-width: none;
		max-height: min(88vh, 88svh);
		overflow: hidden;
	}
	dialog[open] { display: flex; flex-direction: column; animation: arrive .25s ease-out; }
	dialog::backdrop { background: #000d; backdrop-filter: blur(10px); }
	.submission-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
		padding: 10px clamp(22px, 4vw, 40px);
		border-bottom: 1px solid #a1886373;
		color: #c9b596;
		font: 10px var(--code);
		letter-spacing: .14em;
		text-transform: uppercase;
	}
	button, a, select { cursor: pointer; }
	.submission-head button { min-height: 44px; padding: 0 4px; border: 0; background: none; font: inherit; letter-spacing: inherit; text-transform: inherit; }
	.submission-head button:hover { color: #fff; }
	.submission-scroll { overflow-y: auto; overscroll-behavior: contain; padding: clamp(24px, 4vw, 40px); scrollbar-width: thin; }
	h2 { font: 400 clamp(32px, 4vw, 46px)/1.05 var(--display); margin: 0 0 18px; }
	h2:focus { outline: none; }
	.note { font: 14px/1.6 var(--sans); color: #ccc5bb; margin-bottom: 28px; max-width: 70ch; }
	fieldset { display: grid; gap: 24px; border: 0; padding: 0; margin: 0; min-width: 0; }
	fieldset:disabled { opacity: .7; }
	.honey { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }
	.identity-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
	.field { min-width: 0; }
	label { display: block; font: 12px/1.5 var(--code); margin-bottom: 9px; }
	.optional, .required { color: #ccc5bb; font-size: 10px; }
	input, textarea, select { width: 100%; border: 1px solid #a1886380; border-radius: 0; background: #0006; color: #fff; font: 14px/1.5 var(--sans); padding: 11px 13px; min-height: 46px; }
	textarea { display: block; resize: vertical; min-height: 110px; }
	input::placeholder { color: #a9a39a; }
	:where(input, textarea, select, button, a):focus-visible { outline: 2px solid #c9b596; outline-offset: 3px; }
	.select-wrap { position: relative; }
	select { appearance: none; padding-right: 42px; }
	select:invalid { color: #a9a39a; }
	option { color: #fff; background: #0b0908; }
	.chevron { position: absolute; right: 14px; top: 50%; width: 16px; height: 16px; transform: translateY(-50%); pointer-events: none; }
	.chevron::after { content: ''; position: absolute; width: 8px; height: 8px; top: 2px; left: 4px; border-right: 1px solid #c9b596; border-bottom: 1px solid #c9b596; transform: rotate(45deg); }
	.help, .counter, .example, .notice { font: 11px/1.6 var(--code); color: #c5beb3; }
	.help { margin-top: 7px; }
	.field-meta { display: flex; align-items: baseline; gap: 12px; justify-content: space-between; }
	.counter { flex-shrink: 0; }
	.example { margin-top: 10px; font-size: 10px; }
	a { text-decoration: underline; text-underline-offset: 3px; color: #d7c5a9; }
	.submission-actions { border-top: 1px solid #a188634d; padding-top: 24px; }
	.submit { border: 1px solid #a18863; padding: 14px 24px; background: #a1886314; color: #e2e0c9; font: 11px var(--code); letter-spacing: .14em; text-transform: uppercase; min-height: 46px; }
	.submit:hover { background: #a1886333; border-color: #c9b596; }
	.submit:disabled { cursor: wait; }
	.notice:not(:empty) { margin-top: 14px; }
	@keyframes arrive { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
	@media (max-width: 560px) {
		dialog { width: calc(100% - 24px); max-height: calc(100svh - 24px); }
		.identity-fields { grid-template-columns: 1fr; gap: 24px; }
		.submission-head { font-size: 8px; gap: 12px; }
		.submit { width: 100%; }
	}
	@media (prefers-reduced-motion: reduce) { dialog[open] { animation: none; } }
</style>
