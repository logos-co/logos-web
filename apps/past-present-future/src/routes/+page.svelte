<script>
	import { onMount } from "svelte";
	import { navBridge } from "$lib/nav-bridge.svelte.js";
	import { scramble } from "$lib/actions/scramble.js";

	const POINTS = [
		{
			era: "past",
			soon: false,
			video: "/past-present-future/video/museum",
			label: "Explore the Past",
		},
		{
			era: "present",
			soon: false,
			kick: "Present",
			cardTitle: "Life’s<br />Choices",
			video: "/past-present-future/video/promise",
			label: "Experience the Present",
		},
		{
			era: "future",
			soon: true,
			video: "/past-present-future/video/tomorrowmart",
			label: "Discover the Future",
		},
	];
	const ERA_PANEL = { past: 1, present: 2, future: 3 };
	const ERAS = ["past", "present", "future"];
	const ROLL_WORDS = ["has been.", "is now.", "is going."];
	const HEADLINE = "Past. Present. Future.";

	let idx = $state(0);
	let revealed = $state(false);
	let introRun = $state(false);
	let dragActive = $state(false);
	let slotState = $state(["", "", "", ""]);
	let nodeOn = $state([false, false, false, false]);
	let revealIdx = $state(-1);
	let previewIdx = $state(-1);
	let tw = $state("");
	let rollActive = $state(0);
	let rollExit = $state(-1);
	let rollWidth = $state("");
	let sheetOpen = $state(false);

	let mainEl, stageEl, trackEl, bandEl, barEl, sheetWrapEl;
	let panelEls = $state([]);
	let videoEls = $state([]);
	let nodeEls = $state([]);
	let rpVideoEls = $state([]);
	let rollEl, bandLineEl, museumTitleEl, railTailEl, coverSlotEl;
	let railCopyEls = $state([]);

	let cur = 0,
		target = 0,
		max = 0;
	let dragging = false,
		lastX = 0,
		lastY = 0,
		startX = 0,
		startY = 0,
		dragAxis = 0,
		vel = 0,
		moved = 0;
	let alive = false;
	let reduceMotion;

	const timers = [];
	const later = (fn, ms) => {
		const id = window.setTimeout(fn, ms);
		timers.push(id);
		return id;
	};
	const every = (fn, ms) => {
		const id = window.setInterval(fn, ms);
		timers.push(id);
		return id;
	};

	const clamp = (v) => Math.max(0, Math.min(max, v));
	const lerp = (a, b, t) => a + (b - a) * t;
	const centerOf = (p) =>
		p.offsetLeft + p.offsetWidth / 2 - stageEl.clientWidth / 2;

	function measure() {
		max = Math.max(0, trackEl.scrollWidth - stageEl.clientWidth);
		target = clamp(centerOf(panelEls[idx]));
		cur = clamp(cur);
	}

	let slotExit = null;
	function setActiveSlot(i) {
		slotState = slotState.map((s, n) =>
			n === i ? "on" : s === "on" ? "out" : s,
		);
		clearTimeout(slotExit);
		slotExit = later(() => {
			slotState = slotState.map((s) => (s === "on" ? s : ""));
		}, 760);
	}

	function nearestIndex(ref) {
		let bi = 0,
			bd = 1e9;
		panelEls.forEach((p, i) => {
			const d = Math.abs(centerOf(p) - ref);
			if (d < bd) {
				bd = d;
				bi = i;
			}
		});
		return bi;
	}

	function syncVideos() {
		videoEls.forEach((v, videoIndex) => {
			if (!v) return;

			if (reduceMotion.matches || videoIndex !== idx) {
				v.pause();
				return;
			}

			v.play().catch(() => {});
		});
	}

	function goTo(i) {
		idx = Math.max(0, Math.min(panelEls.length - 1, i));
		target = clamp(centerOf(panelEls[idx]));
		setActiveSlot(idx);
		syncVideos();
	}

	function render() {
		trackEl.style.transform = "translate3d(" + -cur + "px,0,0)";
		const barFrom = clamp(centerOf(panelEls[0]));
		const barSpan =
			clamp(centerOf(panelEls[panelEls.length - 1])) - barFrom;
		barEl.style.transform =
			"scaleX(" +
			(barSpan
				? Math.min(1, Math.max(0, (cur - barFrom) / barSpan))
				: 0) +
			")";

		const vw = stageEl.clientWidth,
			vh = stageEl.clientHeight,
			vpc = vw / 2;
		const reach = vw * 0.62;
		panelEls.forEach((p, i) => {
			const w = p.offsetWidth,
				h = p.offsetHeight;
			const cover = Math.max(vw / w, vh / h) * 1.002;
			const c = p.offsetLeft + w / 2 - cur;
			let n = Math.min(1, Math.abs(c - vpc) / reach);
			let e = n * n * (3 - 2 * n);
			const s = lerp(cover, 0.8, e);
			p.style.transform = "scale(" + s.toFixed(4) + ")";
			const pOp = i === idx ? 1 : lerp(1, 0.3, e);
			p.style.opacity = pOp.toFixed(3);
			p.style.borderRadius = lerp(0, 24, e).toFixed(1) + "px";
			p.style.zIndex = Math.round(lerp(40, 2, e));
		});
		nodeEls.forEach((nd, i) => {
			const c = nd.offsetLeft + nd.offsetWidth / 2 - cur;
			nodeOn[i] = Math.abs(c - vpc) < vw * 0.26;
		});
		if (panelEls.length > 1) {
			const introCur = centerOf(panelEls[0]),
				pastCur = centerOf(panelEls[1]);
			const span = pastCur - introCur || 1;
			const t = (cur - introCur) / span;
			const p = Math.min(1, Math.max(0, (t - 0.2) / 0.5));
			navBridge.pillOpacity = p.toFixed(3);
			navBridge.pillEvents = p > 0.5 ? "auto" : "none";
		}
	}

	let settled = true;
	function loop() {
		if (!alive) return;
		if (!dragging) {
			cur += (target - cur) * 0.055;
			if (Math.abs(target - cur) < 0.4) {
				cur = target;
				if (!settled) {
					settled = true;
					syncVideos();
				}
			} else settled = false;
		}
		render();
		requestAnimationFrame(loop);
	}

	function reveal() {
		revealed = true;
		introRun = true;
		setActiveSlot(idx);
		syncVideos();
		later(typeHeadline, 560);
		later(() => (introRun = false), 2200);
	}

	const WHEEL_COOLDOWN = 700;
	let wheelAcc = 0,
		wheelStreaming = false,
		wheelQuiet = null,
		lastWheelStep = -1e9;
	function onWheel(e) {
		if (
			sheetOpen &&
			e.target instanceof Element &&
			sheetWrapEl.contains(e.target)
		)
			return;
		e.preventDefault();
		const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
		if (Math.abs(d) < 1) return;
		const dir = d > 0 ? 1 : -1;

		clearTimeout(wheelQuiet);
		wheelQuiet = later(() => {
			wheelStreaming = false;
			wheelAcc = 0;
		}, 140);

		if (Math.sign(wheelAcc) && dir !== Math.sign(wheelAcc)) {
			wheelAcc = 0;
			wheelStreaming = false;
		}

		const now = performance.now();
		if (now - lastWheelStep < WHEEL_COOLDOWN) return;

		wheelAcc += d;
		if (Math.abs(wheelAcc) >= (wheelStreaming ? 90 : 22)) {
			goTo(idx + dir);
			lastWheelStep = now;
			wheelStreaming = true;
			wheelAcc = 0;
		}
	}

	let dragStartIdx = 0;
	function onPointerDown(e) {
		if (e.pointerType === "mouse") return;
		if (
			sheetOpen &&
			e.target instanceof Element &&
			sheetWrapEl.contains(e.target)
		)
			return;
		dragging = true;
		dragActive = true;
		moved = 0;
		vel = 0;
		dragAxis = 0;
		startX = lastX = e.clientX;
		startY = lastY = e.clientY;
		dragStartIdx = idx;
		target = cur;
	}
	function onPointerMove(e) {
		if (!dragging) return;
		const dx = e.clientX - lastX,
			dy = e.clientY - lastY;
		lastX = e.clientX;
		lastY = e.clientY;
		if (!dragAxis) {
			const tx = Math.abs(e.clientX - startX),
				ty = Math.abs(e.clientY - startY);
			if (Math.max(tx, ty) < 6) return;
			dragAxis = tx > ty ? 1 : 2;
		}
		const d = dragAxis === 1 ? dx : dy;
		moved += Math.abs(d);
		cur = clamp(cur - d);
		vel = vel * 0.85 + -d * 0.15;
	}
	function release() {
		if (!dragging) return;
		dragging = false;
		dragActive = false;
		const flung = nearestIndex(cur + vel * 30);
		goTo(Math.max(dragStartIdx - 1, Math.min(dragStartIdx + 1, flung)));
	}

	function onKeydown(e) {
		if (e.key === "ArrowRight") goTo(idx + 1);
		if (e.key === "ArrowLeft") goTo(idx - 1);
		if (e.key === "Home") goTo(0);
		if (e.key === "End") goTo(panelEls.length - 1);
		if (e.key === "Escape") requestClose();
	}

	function hideSheet() {
		sheetOpen = false;
	}
	function applyHash() {
		hideSheet();
	}
	function requestClose() {
		if (ERAS.includes((location.hash || "").replace(/^#/, ""))) {
			history.replaceState(null, "", location.pathname + location.search);
		}
		hideSheet();
	}

	function pointEnter(i) {
		previewIdx = i;
		const v = rpVideoEls[i];
		if (v) {
			try {
				v.currentTime = 0;
				v.play();
			} catch (e) {}
		}
	}
	function pointLeave(i) {
		previewIdx = -1;
		rpVideoEls[i]?.pause();
	}
	function pointClick(p) {
		if (moved > 8) return;
		if (p.soon) return;
		requestClose();
		goTo(ERA_PANEL[p.era]);
	}

	let rollItemEls = $state([]);
	function sizeRoll() {
		const el = rollItemEls[rollActive];
		if (el) rollWidth = el.getBoundingClientRect().width.toFixed(2) + "px";
	}
	function startRoll() {
		sizeRoll();
		if (window.matchMedia("(prefers-reduced-motion:reduce)").matches)
			return;
		every(() => {
			const curI = rollActive;
			rollExit = curI;
			rollActive = (curI + 1) % ROLL_WORDS.length;
			sizeRoll();
			later(() => {
				if (rollExit === curI) rollExit = -1;
			}, 650);
		}, 2200);
	}

	function typeHeadline() {
		if (window.matchMedia("(prefers-reduced-motion:reduce)").matches) {
			tw = HEADLINE;
			return;
		}
		let i = 0;
		(function step() {
			tw = HEADLINE.slice(0, i);
			if (i < HEADLINE.length) {
				i++;
				later(step, HEADLINE[i - 1] === " " ? 34 : 48);
			}
		})();
	}

	function readBaseY(el) {
		el.style.transform = "";
		const m = getComputedStyle(el).transform;
		el.style.transform = null;
		if (!m || m === "none") return 0;
		const parts = m.match(/matrix\(([^)]+)\)/);
		if (!parts) return 0;
		const nums = parts[1].split(",").map(parseFloat);
		return nums.length >= 6 ? nums[5] : 0;
	}
	function fitBandLine() {
		const el = bandLineEl;
		if (!el) return;
		const base = `translateY(${readBaseY(el)}px)`;
		el.style.transform = base;
		const rollW = rollEl ? rollEl.style.width : "";
		if (rollEl) rollEl.style.width = "";
		const parent = el.parentElement;
		const cs = getComputedStyle(parent);
		const padX =
			parseFloat(cs.paddingLeft || 0) + parseFloat(cs.paddingRight || 0);
		const avail = parent.clientWidth - padX;
		const need = el.scrollWidth;
		if (rollEl) rollEl.style.width = rollW;
		el.style.transform =
			need > avail
				? `${base} scale(${Math.max(0.5, avail / need)})`
				: base;
	}

	function fitRailCopies() {
		railCopyEls.forEach((el) => {
			if (!el) return;
			if (window.innerWidth <= 680) {
				el.style.transform = "";
				return;
			}
			const base = `translateY(${readBaseY(el)}px)`;
			el.style.transform = base;
			const parent = el.parentElement;
			const cs = getComputedStyle(parent);
			const padX =
				parseFloat(cs.paddingLeft || 0) +
				parseFloat(cs.paddingRight || 0);
			const avail = parent.clientWidth - padX;
			const need = el.scrollWidth;
			el.style.transform =
				need > avail
					? `${base} scale(${Math.max(0.5, avail / need)})`
					: base;
		});
	}

	function fitMuseumTitle() {
		const el = museumTitleEl;
		if (!el) return;
		el.style.transform = "none";
		if (window.innerWidth <= 680) return;
		const parent = el.parentElement;
		const cs = getComputedStyle(parent);
		const padX =
			parseFloat(cs.paddingLeft || 0) + parseFloat(cs.paddingRight || 0);
		const avail = parent.clientWidth - padX;
		const need = el.scrollWidth;
		el.style.transform =
			need > avail ? `scale(${Math.max(0.5, avail / need)})` : "none";
	}

	function fitRailTails() {
		const tail = railTailEl,
			rail = coverSlotEl;
		if (!tail || !rail) return;
		const railFit = tail.parentElement;
		tail.style.transform = "none";
		if (window.innerWidth <= 680) return;
		const cs = getComputedStyle(rail);
		const padY =
			parseFloat(cs.paddingTop || 0) + parseFloat(cs.paddingBottom || 0);
		const totalAvail = rail.clientHeight - padY;
		const textHeight = railFit.scrollHeight - tail.scrollHeight;
		const avail = totalAvail - textHeight;
		const need = tail.scrollHeight;
		tail.style.transform =
			need > avail ? `scale(${Math.max(0.5, avail / need)})` : "none";
	}

	function onResize() {
		measure();
		sizeRoll();
		fitBandLine();
		fitRailCopies();
		fitMuseumTitle();
		fitRailTails();
	}

	onMount(() => {
		alive = true;
		document.body.classList.add("home");

		navBridge.pillOpacity = "0";
		navBridge.pillEvents = "none";
		navBridge.onNav = (era) => {
			if (moved > 8) return;
			const i = ERA_PANEL[era];
			if (i == null) return;
			requestClose();
			goTo(i);
		};
		navBridge.onHome = () => {
			requestClose();
			goTo(0);
		};

		reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
		const applyMotionPref = () => syncVideos();
		reduceMotion.addEventListener("change", applyMotionPref);
		queueMicrotask(applyMotionPref);

		window.addEventListener("wheel", onWheel, { passive: false });

		later(reveal, 350);

		if (document.fonts && document.fonts.ready)
			document.fonts.ready.then(() => {
				if (!alive) return;
				measure();
				sizeRoll();
				fitBandLine();
				fitRailCopies();
				fitMuseumTitle();
				fitRailTails();
			});
		measure();
		loop();

		applyHash();

		startRoll();
		fitBandLine();
		fitRailCopies();
		fitMuseumTitle();
		fitRailTails();
		later(fitBandLine, 400);
		later(fitRailCopies, 400);
		later(fitMuseumTitle, 400);
		later(fitRailTails, 400);

		const to = new URLSearchParams(location.search).get("to");
		if (to) {
			const i =
				to === "choice"
					? panelEls.length - 1
					: to === "home"
						? 0
						: (ERA_PANEL[to] ?? -1);
			if (i >= 0) {
				goTo(i);
				cur = target;
				render();
			}
		}

		return () => {
			alive = false;
			timers.forEach(clearTimeout);
			timers.forEach(clearInterval);
			window.removeEventListener("wheel", onWheel);
			reduceMotion.removeEventListener("change", applyMotionPref);
			document.body.classList.remove("home");
			navBridge.pillOpacity = null;
			navBridge.pillEvents = null;
			navBridge.onNav = null;
			navBridge.onHome = null;
		};
	});

</script>

<svelte:window
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={release}
	onpointercancel={release}
	onkeydown={onKeydown}
	onresize={onResize}
	onhashchange={applyHash}
	onload={measure}
/>

<svelte:head>
	<title>Past · Present · Future</title>
	<meta
		name="description"
		content="This is a Logos project to examine where society has been. Make a choice. Remain. Or exit with us."
	/>
</svelte:head>

<main class="home" bind:this={mainEl}>
	<div
		class="stage"
		class:revealed
		class:drag={dragActive}
		data-idx={idx}
		bind:this={stageEl}
	>
		<div class="track" bind:this={trackEl}>
			<div class="rail"></div>
			<span class="spark"></span><span class="spark s2"></span>

				<section
					class="panel intro video-mode"
					bind:this={panelEls[0]}
				>
					<video
						class="intro-bg"
						autoplay
						muted
						loop
						playsinline
						preload="auto"
						poster="/past-present-future/video/montage-poster.webp"
						bind:this={videoEls[0]}
					>
						<source src="/past-present-future/video/montage.mp4" type="video/mp4" />
						<source src="/past-present-future/video/montage.webm" type="video/webm" />
					</video>
				</section>
			<div class="node" class:on={nodeOn[0]} bind:this={nodeEls[0]}>
				<span class="tag">Past</span><span class="dot"></span>
			</div>

			<section
				class="panel past"
				class:reveal={revealIdx === 1}
				bind:this={panelEls[1]}
			>
				<video class="bg" muted loop playsinline preload="none" bind:this={videoEls[1]}>
					<source src="/past-present-future/video/museum.webm" type="video/webm" />
					<source src="/past-present-future/video/museum.mp4" type="video/mp4" />
				</video>
				<div class="scrim"></div>
				<div class="vignette"></div>
				<div class="grain"></div>
			</section>
			<div class="node" class:on={nodeOn[1]} bind:this={nodeEls[1]}>
				<span class="tag">Present</span><span class="dot"></span>
			</div>

			<section
				class="panel present"
				class:reveal={revealIdx === 2}
				bind:this={panelEls[2]}
			>
				<video class="bg" muted loop playsinline preload="none" bind:this={videoEls[2]}>
					<source src="/past-present-future/video/promise.webm" type="video/webm" />
					<source src="/past-present-future/video/promise.mp4" type="video/mp4" />
				</video>
				<div class="scrim"></div>
				<div class="vignette"></div>
				<div class="grain"></div>
			</section>
			<div class="node" class:on={nodeOn[2]} bind:this={nodeEls[2]}>
				<span class="tag">Future</span><span class="dot"></span>
			</div>

			<section
				class="panel future"
				class:reveal={revealIdx === 3}
				bind:this={panelEls[3]}
			>
				<video class="bg" muted loop playsinline preload="none" bind:this={videoEls[3]}>
					<source src="/past-present-future/video/tomorrowmart.webm" type="video/webm" />
					<source src="/past-present-future/video/tomorrowmart.mp4" type="video/mp4" />
				</video>
				<div class="scrim"></div>
				<div class="tint"></div>
				<div class="vignette"></div>
				<div class="grain"></div>
			</section>
			<div class="node end" class:on={nodeOn[3]} bind:this={nodeEls[3]}>
				<span class="dot"></span>
			</div>
		</div>

		<div
			class="rail-band"
			class:intro-run={introRun}
			bind:this={bandEl}
		>
			<div class="rail-band-tint" aria-hidden="true"></div>
			<div class="rail-band-grain" aria-hidden="true"></div>

			<div
				class="rail-slot cover-rail"
				class:on={slotState[0] === "on"}
				class:out={slotState[0] === "out"}
				data-slot="0"
				bind:this={coverSlotEl}
			>
				<div class="rail-fit">
					<h1
						class="intro-hero-h"
						aria-label="Past. Present. Future."
					>
						<span class="tw" aria-hidden="true">{tw}</span><span
							class="tw-cur"
							aria-hidden="true"
						></span>
					</h1>
					<div class="intro-hero-copy">
						<p class="rail-sub">
							The promises society was built on have been broken.
						</p>
					</div>
					<p class="rail-copy band-line" bind:this={bandLineEl}>
						This is a Logos project to examine where society <span
							class="roll"
							aria-hidden="true"
							style:width={rollWidth}
							bind:this={rollEl}
							>{#each ROLL_WORDS as w, j}<span
									class="roll-item"
									class:active={rollActive === j}
									class:exit={rollExit === j}
									bind:this={rollItemEls[j]}>{w}</span
								>{/each}</span
						> <strong>Make a choice.</strong> Remain.
						<br class="mbr" />Or exit with us.
					</p>
					<div class="rail-tail-fit" bind:this={railTailEl}>
						<div class="timeline">
							<span class="tl-line" aria-hidden="true"></span>
							{#each POINTS as p, i}
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="tl-point"
									class:soon={p.soon}
									data-era={p.era}
									onpointerenter={() => pointEnter(i)}
									onpointerleave={() => pointLeave(i)}
									onfocusin={() => pointEnter(i)}
									onfocusout={() => pointLeave(i)}
								>
									<figure
										class="rp-card"
										class:show={previewIdx === i}
										data-era={p.era}
									>
										<video
											class="rp-vid"
											muted
											loop
											playsinline
											preload="none"
											bind:this={rpVideoEls[i]}
										>
											<source
												src="{p.video}.webm"
												type="video/webm"
											/>
											<source
												src="{p.video}.mp4"
												type="video/mp4"
											/>
										</video>
										<span class="rp-scrim"></span>
										<figcaption class="rp-meta">
											{#if p.soon}
												<span class="rp-title"
													>Coming soon</span
												>
											{:else if p.cardTitle}
												<span class="rp-kick"
													>{p.kick}</span
												><span class="rp-title"
													>{@html p.cardTitle}</span
												>
											{:else}
												<span class="rp-kick">Past</span
												><span class="rp-title"
													>The Museum of<br />Civil
													Liberties</span
												>
											{/if}
										</figcaption>
									</figure>
									<span class="tl-pulse" aria-hidden="true"
									></span>
									<span class="tl-dot"></span>
									<button
										class="tl-label"
										type="button"
										data-slide={p.era}
										aria-disabled={p.soon || undefined}
										onclick={() => pointClick(p)}
										>{p.label}</button
									>
								</div>
							{/each}
						</div>
						<div class="scroll-hint" aria-hidden="true">
							<span>SCROLL</span><span class="arw">→</span>
						</div>
					</div>
				</div>
			</div>

			<div
				class="rail-slot past-rail"
				class:on={slotState[1] === "on"}
				class:out={slotState[1] === "out"}
				data-slot="1"
			>
				<div class="rail-fit">
					<div class="kick">Explore the Past</div>
					<h2 class="h museum-title" bind:this={museumTitleEl}>
						The Museum of Civil Liberties
					</h2>
					<p class="copy" bind:this={railCopyEls[0]}>
						Your freedoms are eroding. We’re creating the record. So
						current and future generations know what was. <br />And
						can make the choice: remain, or exit. Preserving the
						lessons of the past.
					</p>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="ctas"
						onpointerenter={() => (revealIdx = 1)}
						onpointerleave={() => (revealIdx = -1)}
					>
						<a
							class="cta"
							href="/past-present-future/museum-of-civil-liberties"
							use:scramble
							onfocus={() => (revealIdx = 1)}
							onblur={() => (revealIdx = -1)}
							onclick={(e) => {
								if (moved > 8) e.preventDefault();
							}}>Visit the Museum <span class="arw">→</span></a
						>
					</div>
				</div>
			</div>

			<div
				class="rail-slot present-rail"
				class:on={slotState[2] === "on"}
				class:out={slotState[2] === "out"}
				data-slot="2"
			>
				<div class="rail-fit">
					<div class="kick">Experience the Present</div>
					<h2 class="h">Life’s Choices</h2>
					<p class="copy" bind:this={railCopyEls[1]}>
						Every life choice. Everywhere in the world. The system works against you.
						<br />Dive into 3 interactive films that show life’s choices, and the system’s response.
					</p>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="ctas"
						onpointerenter={() => (revealIdx = 2)}
						onpointerleave={() => (revealIdx = -1)}
					>
						<a
							class="cta"
							href="/past-present-future/choices"
							use:scramble
							onfocus={() => (revealIdx = 2)}
							onblur={() => (revealIdx = -1)}
							onclick={(e) => {
								if (moved > 8) e.preventDefault();
							}}>Enter the Experience <span class="arw">→</span></a
						>
					</div>
				</div>
			</div>

			<div
				class="rail-slot future-rail"
				class:on={slotState[3] === "on"}
				class:out={slotState[3] === "out"}
				data-slot="3"
			>
				<div class="rail-fit">
					<div class="kick">Discover the Future</div>
					<h2 class="h">TomorrowMart</h2>
					<p class="copy" bind:this={railCopyEls[2]}>
						Everyday groceries and essentials continue to increase
						in price. <br />TomorrowMart takes today’s inflation,
						and shows you what tomorrow’s prices will be.
					</p>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="ctas"
						onpointerenter={() => (revealIdx = 3)}
						onpointerleave={() => (revealIdx = -1)}
					>
						<span class="cta soon" aria-disabled="true" use:scramble
							>Coming soon</span
						>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="prog" aria-hidden="true"><i bind:this={barEl}></i></div>

	<div
		class="sheet-wrap"
		class:open={sheetOpen}
		aria-hidden={sheetOpen ? "false" : "true"}
		inert={!sheetOpen}
		bind:this={sheetWrapEl}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="sheet-bg" onclick={requestClose}></div>
		<div
			class="sheet"
			role="dialog"
			aria-modal="true"
			aria-labelledby="sheetTitle"
		>
			<button class="sheet-x" type="button" onclick={requestClose}
				>Close <span aria-hidden="true">×</span></button
			>
			<div class="sheet-scroll"></div>
		</div>
	</div>
</main>

<style>
	.stage {
		position: fixed;
		inset: 0;
		overflow: hidden;
		cursor: default;
		touch-action: none;
	}
	.track {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		display: flex;
		align-items: center;
		padding: 0 clamp(40px, 7vw, 140px);
		will-change: transform;
	}
	.rail {
		position: absolute;
		top: 50%;
		left: 0;
		height: 1px;
		z-index: 0;
		transform: translateY(-50%);
		background: linear-gradient(
			90deg,
			transparent 0,
			var(--hair) 4%,
			var(--hair) 96%,
			transparent 100%
		);
	}
	.spark {
		position: absolute;
		top: 50%;
		left: 0;
		width: 70px;
		height: 1px;
		transform: translateY(-50%);
		z-index: 0;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(236, 236, 228, 0.95),
			transparent
		);
		box-shadow: 0 0 8px rgba(236, 236, 228, 0.5);
		animation: h-flow 7.5s linear infinite;
	}
	.spark.s2 {
		animation-delay: 3.75s;
		opacity: 0.45;
	}
	@keyframes h-flow {
		0% {
			left: -90px;
		}
		100% {
			left: 100%;
		}
	}
	.node {
		flex: 0 0 auto;
		width: clamp(120px, 13vw, 210px);
		height: 100%;
		position: relative;
		z-index: 8;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.node .dot {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		background: var(--paper);
		position: relative;
		transition:
			transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1),
			box-shadow 0.45s;
	}
	.node .dot::after {
		content: "";
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 1px solid var(--paper);
		opacity: 0;
		animation: h-ring 2.8s ease-out infinite;
	}
	@keyframes h-ring {
		0% {
			transform: scale(1);
			opacity: 0.55;
		}
		100% {
			transform: scale(3);
			opacity: 0;
		}
	}
	.node .tag {
		position: absolute;
		top: calc(50% - 46px);
		left: 50%;
		transform: translateX(-50%);
		font-size: 13.2px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: var(--faint);
		white-space: nowrap;
		transition:
			color 0.45s,
			letter-spacing 0.45s;
	}
	.node.on .dot {
		transform: scale(1.35);
		box-shadow: 0 0 0 5px rgba(236, 236, 228, 0.07);
	}
	.node.on .tag {
		color: var(--paper);
		letter-spacing: 0.4em;
	}
	.node.end .dot {
		background: transparent;
		border: 1px solid var(--faint);
		width: 9px;
		height: 9px;
	}
	.node.end .dot::after {
		display: none;
	}
	.panel {
		flex: 0 0 auto;
		position: relative;
		z-index: 2;
		transform-origin: center center;
		width: 84vw;
		height: 72vh;
		height: 72dvh;
		border-radius: 24px;
		overflow: hidden;
		isolation: isolate;
		background: #000;
		box-shadow: 0 40px 90px -34px rgba(0, 0, 0, 0.75);
		will-change: transform, opacity;
	}
	.panel.present {
		height: 84vh;
		height: 84dvh;
	}
	.panel::after {
		content: "";
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		z-index: 6;
		box-shadow: inset 0 0 0 1px var(--hair);
	}
	.bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		z-index: 0;
		filter: none;
		transform: none;
		transition:
			filter 0.6s ease,
			transform 0.6s ease;
	}
	.panel.reveal .bg {
		filter: none;
		transform: none;
	}
	.panel.reveal .scrim {
		opacity: 0.78;
	}
	.past .scrim,
	.past.reveal .scrim {
		opacity: 0.5;
	}
	.past .vignette {
		opacity: 0.4;
	}
	.past::before {
		content: "";
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		background: rgba(0, 0, 0, 0.2);
	}
	.past .bg {
		filter: saturate(1.02);
		opacity: 1;
		transform: scale(1);
	}
	.past.reveal .bg {
		filter: saturate(1.05);
		opacity: 1;
		transform: scale(1.04);
	}
	.past-rail .copy,
	.present-rail .copy,
	.future-rail .copy {
		font-family:
			"Public Sans",
			system-ui,
			-apple-system,
			sans-serif;
		font-weight: 400;
		font-size: clamp(15.6px, calc(0.92vw + 4px), 16.9px);
		line-height: 1.25;
		margin-top: clamp(14px, 1.85vh, 23px);
		white-space: nowrap;
		transform-origin: center top;
	}
	.past-rail .copy {
		max-width: 100ch;
	}
	.present-rail .copy {
		max-width: 100ch;
	}
	.scrim {
		position: absolute;
		inset: 0;
		z-index: 1;
		transition: opacity 0.55s ease;
		background: linear-gradient(
			180deg,
			rgba(10, 12, 11, 0.2) 0,
			rgba(10, 12, 11, 0.52) 55%,
			rgba(10, 12, 11, 0.92) 100%
		);
	}
	.grain {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
		opacity: 0.05;
		mix-blend-mode: overlay;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}
	.vignette {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		background: linear-gradient(
			180deg,
			rgba(0, 0, 0, 0) 0%,
			rgba(0, 0, 0, 1) 100%
		);
	}
	.present .bg {
		filter: blur(6px) saturate(1.02);
		opacity: 1;
		transform: scale(1);
	}
	.present.reveal .bg {
		filter: blur(6px) saturate(1.05);
		opacity: 1;
		transform: scale(1.04);
	}
	.future .bg {
		filter: blur(6px) saturate(1.1) hue-rotate(8deg);
		opacity: 1;
		transform: scale(1);
	}
	.future.reveal .bg {
		filter: blur(6px) saturate(1.2) hue-rotate(8deg);
		opacity: 1;
		transform: scale(1.04);
	}
	.future-rail .copy {
		max-width: 100ch;
	}
	.future .scrim {
		background: linear-gradient(
			180deg,
			rgba(28, 46, 86, 0.3) 0,
			rgba(14, 26, 54, 0.58) 55%,
			rgba(7, 13, 30, 0.92) 100%
		);
	}
	.future .tint {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		mix-blend-mode: screen;
		transition: opacity 0.55s ease;
		background: radial-gradient(
			120% 90% at 50% 38%,
			rgba(64, 116, 210, 0.34),
			rgba(24, 52, 120, 0.1) 60%,
			transparent 80%
		);
	}
	.future.reveal .tint {
		opacity: 0.55;
	}
	.kick {
		font-family: "Fira Code", monospace;
		font-weight: 465;
		font-size: 13.2px;
		letter-spacing: 0.01em;
		line-height: 0.92;
		text-transform: uppercase;
		color: #fff;
		display: inline-flex;
		align-items: center;
		gap: 10px;
	}
	.h {
		font-family: var(--display);
		font-weight: 400;
		line-height: 0.94;
		letter-spacing: -0.03em;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	.copy {
		font-size: clamp(14.4px, 1.1vw, 16.8px);
		line-height: 1.04;
		color: #fff;
		max-width: 42ch;
		transform: translateY(calc(-1 * clamp(7px, 0.945vh, 10.5px)));
	}
	.ctas {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.cta {
		display: inline-flex;
		align-items: center;
		gap: 11px;
		font-family: var(--code);
		font-size: 14.4px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		padding: 14px 24px;
		border: 1px solid var(--hair);
		border-radius: 100px;
		-webkit-appearance: none;
		appearance: none;
		cursor: pointer;
		border-color: transparent;
		text-decoration: none;
		color: #000;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(2px);
		transition:
			background 0.3s,
			border-color 0.3s,
			color 0.3s;
	}
	.cta .arw {
		transition: transform 0.3s;
	}
	.cta:hover {
		background: #fff;
		color: #000;
		border-color: transparent;
	}
	.cta:hover .arw {
		transform: translateX(6px);
	}
	.past-rail .cta,
	.present-rail .cta,
	.future-rail .cta {
		gap: 7.7px;
		font-size: 10.1px;
		padding: 9.8px 16.8px;
	}
	.cta.soon {
		opacity: 1;
		cursor: default;
		pointer-events: none;
	}
	.intro-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		z-index: 0;
		filter: none;
		transform: none;
		transition:
			filter 1.2s cubic-bezier(0.16, 1, 0.3, 1),
			transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.stage.revealed .intro-bg {
		filter: none;
		transform: none;
	}
	.panel.intro {
		background: #000;
	}
	.panel.intro.video-mode::before {
		content: "";
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		background: rgba(0, 0, 0, 0.15);
	}
	.panel.intro::after {
		box-shadow: inset 0 0 0 1px rgba(10, 12, 11, 0.12);
	}
	.rail-band {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 50vh;
		height: 50dvh;
		z-index: 50;
		overflow: hidden;
		isolation: isolate;
		text-align: center;
		pointer-events: none;
		backdrop-filter: blur(6px) saturate(1.5);
		-webkit-backdrop-filter: blur(6px) saturate(1.5);
		transform: translateY(100%);
		transition:
			transform 0.9s cubic-bezier(0.16, 1, 0.3, 1),
			opacity 0.45s ease;
	}
	.stage.revealed .rail-band {
		transform: translateY(0);
	}

	.rail-slot {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
		padding: clamp(28px, 3.6vh, 46px) clamp(30px, 3.4vw, 60px);
	}
	.rail-slot.on {
		pointer-events: auto;
	}
	.rail-band .rail-slot > .rail-fit > * {
		opacity: 0;
		translate: 0 20px;
		transition:
			opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
			translate 0.66s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.rail-band .rail-slot.on > .rail-fit > * {
		opacity: 1;
		translate: 0 0;
	}
	.rail-band .rail-slot.out > .rail-fit > * {
		opacity: 0;
		translate: 0 -16px;
	}
	.rail-band .rail-slot.on > .rail-fit > *:nth-child(1) {
		transition-delay: 0.06s;
	}
	.rail-band .rail-slot.on > .rail-fit > *:nth-child(2) {
		transition-delay: 0.13s;
	}
	.rail-band .rail-slot.on > .rail-fit > *:nth-child(3) {
		transition-delay: 0.2s;
	}
	.rail-band .rail-slot.on > .rail-fit > *:nth-child(4) {
		transition-delay: 0.27s;
	}

	.rail-band.intro-run .rail-slot.on > .rail-fit > .intro-hero-copy {
		transition-delay: 0.3s;
	}
	.rail-band.intro-run .rail-slot.on > .rail-fit > .intro-hero-h {
		transition-delay: 0.44s;
	}
	.rail-band.intro-run .rail-slot.on > .rail-fit > .band-line {
		transition-delay: 0.86s;
	}
	.rail-band.intro-run .rail-slot.on > .rail-fit > .rail-tail-fit {
		transition-delay: 1.02s;
	}
	.rail-fit {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(14px, 2vh, 24px);
	}
	.cover-rail .rail-fit {
		justify-content: center;
	}
	.past-rail .rail-fit,
	.present-rail .rail-fit,
	.future-rail .rail-fit {
		justify-content: center;
		gap: clamp(10px, 1.35vh, 15px);
	}
	.rail-tail-fit {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		z-index: 5;
		gap: clamp(14px, 2vh, 24px);
		transform-origin: top center;
	}
	.rail-band-grain {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		opacity: 0.09;
		mix-blend-mode: overlay;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}
	.rail-band-tint {
		position: absolute;
		inset: 0;
		background: rgba(221, 221, 221, 0.15);
		z-index: 0;
	}
	.past-rail .kick,
	.present-rail .kick,
	.future-rail .kick {
		width: 100%;
		justify-content: center;
	}
	.past-rail .h,
	.present-rail .h,
	.future-rail .h {
		width: 100%;
		margin-top: 0;
	}
	.museum-title {
		white-space: nowrap;
		transform-origin: center top;
	}
	.intro-hero-h {
		font-family: var(--display);
		font-weight: 400;
		letter-spacing: -0.03em;
		line-height: 0.94;
		font-size: clamp(39.5px, 5.47vw, 94.7px);
		color: var(--paper);
		pointer-events: none;
		margin-bottom: calc(clamp(24px, 3.2vh, 38px) - clamp(14px, 2vh, 24px));
	}
	.intro-hero-h .tw-cur {
		background: var(--paper);
	}
	.intro-hero-copy {
		order: -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		width: 100%;
		max-width: 64ch;
		margin: 0 auto;
		margin-bottom: calc(clamp(10px, 1.25vh, 15px) - clamp(14px, 2vh, 24px));
		text-align: center;
		transform: translateY(10px);
		pointer-events: none;
		transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.stage.revealed .intro-hero-copy {
		transform: none;
	}
	.rail-sub {
		width: 100%;
		text-align: center;
		font-family: var(--code);
		font-weight: 400;
		letter-spacing: 0.01em;
		text-transform: uppercase;
		font-size: 13.2px;
		line-height: 0.92;
		color: #fff;
		margin: 2px 0 0;
	}
	.rail-copy {
		width: 100%;
		text-align: center;
		font-family:
			"Public Sans",
			system-ui,
			-apple-system,
			sans-serif;
		font-weight: 400;
		font-size: clamp(13.6px, calc(0.92vw + 2px), 14.9px);
		line-height: 1.2;
		color: #fff;
		max-width: 62ch;
		margin: 0;
		transform: translateY(calc(-1 * clamp(7px, 0.945vh, 10.5px)));
	}
	.band-line {
		width: 100%;
		max-width: none;
		white-space: nowrap;
		position: relative;
		z-index: 1;
		font-size: clamp(17.6px, calc(0.92vw + 6px), 18.9px);
		font-weight: 400;
		margin: 0;
		transform-origin: center top;
	}
	.band-line br.mbr {
		display: none;
	}
	.band-line .roll-item {
		color: inherit;
	}
	.rail-copy strong {
		font-weight: inherit;
	}
	@media (max-width: 820px) {
		.band-line {
			white-space: normal;
			max-width: 62ch;
		}
	}
	.roll {
		position: relative;
		display: inline-grid;
		vertical-align: baseline;
		overflow: hidden;
		text-align: left;
		line-height: 1.3;
		padding-bottom: 0.08em;
		transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.roll-item {
		grid-area: 1/1;
		align-self: center;
		justify-self: start;
		opacity: 0;
		transform: translateY(100%);
		color: var(--paper);
		transition:
			opacity 0.5s ease,
			transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		white-space: nowrap;
	}
	@media (prefers-reduced-motion: reduce) {
		.roll {
			transition: none;
		}
	}
	.roll-item.active {
		opacity: 1;
		transform: translateY(0);
	}
	.roll-item.exit {
		opacity: 0;
		transform: translateY(-100%);
	}
	.scroll-hint {
		display: flex;
		align-items: center;
		gap: 9px;
		font-family: "Fira Code", monospace;
		font-size: 16.8px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--paper);
		pointer-events: none;
		white-space: nowrap;
		opacity: 0;
		transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1);
		transform: translateY(44px);
	}
	.stage.revealed .scroll-hint {
		opacity: 1;
	}
	.scroll-hint .arw {
		display: inline-block;
		animation: h-hintArrow 1.6s ease-in-out infinite;
	}
	@keyframes h-hintArrow {
		0%,
		100% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(6px);
		}
	}
	@media (max-width: 680px) {
		.scroll-hint {
			font-size: 12px;
			letter-spacing: 1px;
		}
	}
	.timeline {
		position: relative;
		z-index: 2;
		width: 100%;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		padding-top: 6px;
		transform: translateY(clamp(8px, 1.2vh, 14px));
	}
	.tl-line {
		position: absolute;
		left: 16.667%;
		right: 16.667%;
		top: 11.5px;
		height: 1px;
		background: #f5f5f5;
		z-index: 0;
	}
	.tl-point {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 0 clamp(10px, 1.6vw, 20px);
		cursor: pointer;
		opacity: 0;
		transform: translateY(10px);
		transition:
			opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.tl-point.soon {
		cursor: not-allowed;
	}
	.stage.revealed .tl-point {
		opacity: 1;
		transform: none;
	}
	.stage.revealed .tl-point:nth-of-type(1) {
		transition-delay: 0.12s;
	}
	.stage.revealed .tl-point:nth-of-type(2) {
		transition-delay: 0.24s;
	}
	.stage.revealed .tl-point:nth-of-type(3) {
		transition-delay: 0.36s;
	}
	.tl-dot {
		display: block;
		position: relative;
		width: 11px;
		height: 11px;
		border-radius: 50%;
		border: 1px solid #f5f5f5;
		background: transparent;
		transition:
			background 0.35s ease,
			border-color 0.35s ease,
			transform 0.35s ease,
			box-shadow 0.35s ease;
	}
	.tl-point:not(.soon) .tl-dot {
		background: #f5f5f5;
		border-color: #f5f5f5;
	}
	.tl-pulse {
		position: absolute;
		top: 5.5px;
		left: 50%;
		width: 11px;
		height: 11px;
		margin: 0;
		border-radius: 50%;
		background: #f5f5f5;
		opacity: 0;
		pointer-events: none;
		z-index: 0;
		animation: h-tlPulse 2.6s cubic-bezier(0.3, 0.6, 0.4, 1) infinite;
	}
	.tl-point:nth-of-type(1) .tl-pulse {
		animation-delay: 0s;
	}
	.tl-point:nth-of-type(2) .tl-pulse {
		animation-delay: 0.5s;
	}
	.tl-point:nth-of-type(3) .tl-pulse {
		animation-delay: 1s;
	}
	.tl-point:hover .tl-pulse,
	.tl-point:focus-within .tl-pulse {
		animation-play-state: paused;
		opacity: 0;
	}
	@keyframes h-tlPulse {
		0% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 0.45;
		}
		75% {
			transform: translate(-50%, -50%) scale(3.2);
			opacity: 0;
		}
		100% {
			transform: translate(-50%, -50%) scale(3.2);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tl-pulse {
			animation: none;
			display: none;
		}
	}
	.tl-point:hover .tl-dot,
	.tl-point:focus-within .tl-dot {
		transform: scale(1.35);
		box-shadow: 0 0 0 5px rgba(21, 37, 33, 0.12);
	}
	.timeline:hover .tl-dot,
	.timeline:focus-within .tl-dot {
		background: #475651;
		border-color: rgba(236, 236, 228, 0.85);
		opacity: 1;
	}
	.timeline:hover .tl-point:hover .tl-dot,
	.timeline:focus-within .tl-point:focus-within .tl-dot {
		background: var(--paper);
		border-color: var(--paper);
	}
	.tl-point .tl-label::after {
		content: "";
		position: absolute;
		inset: 0;
	}
	.tl-point .tl-label {
		display: inline-block;
		text-align: center;
		font-family: var(--display);
		font-weight: 400;
		font-size: 14.8pt;
		letter-spacing: -0.01em;
		line-height: 1.15;
		color: #f5f5f5;
		border: 0;
		background: none;
		margin: 0;
		padding: 0;
		appearance: none;
		-webkit-appearance: none;
		cursor: pointer;
		transition: opacity 0.25s ease;
	}
	.tl-point:hover .tl-label {
		opacity: 0.75;
	}
	.tl-point.soon .tl-label {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.tl-point.soon:hover .tl-label {
		opacity: 0.6;
	}
	.tl-point.soon .tl-dot {
		opacity: 0.45;
	}
	.timeline:hover .tl-point.soon .tl-dot,
	.timeline:focus-within .tl-point.soon .tl-dot {
		opacity: 1;
	}
	.tl-point.soon .rp-card {
		pointer-events: none;
	}
	.tl-point.soon .rp-card.show {
		opacity: 1;
	}
	.rp-card {
		position: absolute;
		left: 50%;
		bottom: calc(100% + 16px);
		margin: 0;
		width: min(100%, 230px);
		aspect-ratio: 16/10;
		border-radius: clamp(36.8px, 4vw, 61.6px);
		overflow: hidden;
		opacity: 0;
		transform: translateX(-50%) scale(0.955) translateY(10px);
		transform-origin: bottom center;
		box-shadow: 0 34px 80px -34px rgba(10, 12, 11, 0.55);
		pointer-events: none;
		z-index: 20;
		transition:
			opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.rp-card.show {
		opacity: 1;
		transform: translateX(-50%) scale(1) translateY(0);
	}
	.rp-vid {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.rp-card[data-era="present"] .rp-vid {
		transform: scale(1.15);
	}
	.tl-point.soon .rp-vid {
		filter: blur(6px) brightness(0.4) saturate(0.8);
	}
	.rp-scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			rgba(10, 12, 11, 0.12) 0,
			rgba(10, 12, 11, 0.72) 100%
		);
	}
	.tl-point.soon .rp-scrim {
		background: rgba(8, 10, 9, 0.62);
	}
	.rp-meta {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		color: #e2e0c9;
		text-align: center;
		padding: clamp(10.4px, 1.15vw, 15.2px) clamp(12.8px, 1.41vw, 19.2px)
			clamp(16.8px, 1.79vw, 23.2px);
	}
	.tl-point.soon .rp-meta {
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}
	.rp-kick {
		display: block;
		font-family: var(--code);
		font-size: 7.7px;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: #e2e0c9;
		opacity: 1;
	}
	.rp-title {
		display: block;
		font-family: var(--display);
		font-weight: 400;
		letter-spacing: -0.01em;
		line-height: 1.04;
		font-size: clamp(13.4px, 1.3vw, 18.2px);
		margin-top: 4.8px;
		color: #e2e0c9;
	}
	.tl-point.soon .rp-title {
		font-family: "Fira Code", monospace;
		font-weight: 300;
		color: #fff;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-size: clamp(10.7px, 1.11vw, 15.5px);
	}
	@media (max-width: 900px) {
		.rp-card {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.rp-card {
			transition: opacity 0.3s ease;
		}
		.rp-card.show {
			transform: none;
		}
	}
	.tw-cur {
		display: inline-block;
		width: 0.44em;
		height: 0.8em;
		background: var(--ink);
		margin-left: 0.09em;
		transform: translateY(0.04em);
		animation: h-blinkSq 1.05s steps(1, end) infinite;
	}
	@keyframes h-blinkSq {
		0%,
		49% {
			opacity: 1;
		}
		50%,
		100% {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tw-cur {
			animation: none;
			opacity: 0.5;
		}
		.rail-band {
			transition: none;
			transform: none;
		}
		.rail-slot > .rail-fit > * {
			transition: opacity 0.2s linear;
			translate: none;
		}
		.tl-point {
			transition: none;
			opacity: 1;
			transform: none;
		}
	}
	.past-rail .h,
	.present-rail .h,
	.future-rail .h {
		font-size: clamp(39.5px, 5.47vw, 94.7px);
	}
	.prog {
		position: fixed;
		left: 0;
		bottom: 0;
		height: 2px;
		width: 100%;
		z-index: 120;
		background: rgba(236, 236, 228, 0.06);
	}
	.prog i {
		display: block;
		height: 100%;
		width: 100%;
		background: var(--paper);
		transform: scaleX(0);
		transform-origin: left center;
		transition: transform 0.08s linear;
	}
	.sheet-wrap {
		position: fixed;
		inset: 0;
		z-index: 300;
		display: flex;
		justify-content: center;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.45s ease;
	}
	.sheet-wrap.open {
		opacity: 1;
		pointer-events: auto;
	}
	.sheet-bg {
		position: absolute;
		inset: 0;
		background: rgba(6, 7, 7, 0.74);
		backdrop-filter: blur(9px) saturate(0.85);
		cursor: pointer;
	}
	.sheet {
		position: relative;
		width: min(900px, 100%);
		height: 100%;
		background: #a0a5a1;
		color: #182521;
		--paper: #182521;
		--dim: rgba(21, 37, 33, 0.74);
		--faint: rgba(21, 37, 33, 0.48);
		--hair: rgba(21, 37, 33, 0.2);
		--ink: #a0a5a1;
		border-left: 1px solid var(--hair);
		border-right: 1px solid var(--hair);
		transform: translateY(30px);
		opacity: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		transition:
			transform 0.55s cubic-bezier(0.2, 0.7, 0.2, 1),
			opacity 0.45s ease;
	}
	.sheet-wrap.open .sheet {
		transform: translateY(0);
		opacity: 1;
	}
	.sheet::after {
		content: "";
		position: absolute;
		inset: 0;
		z-index: 9;
		pointer-events: none;
		opacity: 0.045;
		mix-blend-mode: overlay;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}
	.sheet-x {
		position: absolute;
		top: 22px;
		right: 24px;
		z-index: 12;
		font-family: var(--code);
		font-size: 13.2px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--dim);
		background: rgba(21, 37, 33, 0.06);
		-webkit-backdrop-filter: blur(6px);
		backdrop-filter: blur(6px);
		border: 1px solid var(--hair);
		border-radius: 100px;
		padding: 10px 18px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 9px;
		transition:
			background 0.3s,
			color 0.3s,
			border-color 0.3s;
	}
	.sheet-x:hover {
		background: var(--paper);
		color: var(--ink);
		border-color: var(--paper);
	}
	.sheet-scroll {
		overflow-y: auto;
		height: 100%;
		-webkit-overflow-scrolling: touch;
		touch-action: pan-y;
		overscroll-behavior: contain;
		padding: clamp(64px, 9vh, 104px) clamp(26px, 6vw, 84px)
			clamp(64px, 10vh, 120px);
	}
	.sheet-scroll::-webkit-scrollbar {
		width: 8px;
	}
	.sheet-scroll::-webkit-scrollbar-thumb {
		background: var(--hair);
		border-radius: 8px;
	}
	@media (max-width: 680px) {
		.panel {
			width: 90vw;
			height: 80vh;
			height: 80dvh;
			border-radius: 18px;
		}
		.past-rail .h,
		.present-rail .h,
		.future-rail .h {
			font-size: clamp(32.3px, 9.78vw, 58.7px);
		}
		.node {
			width: clamp(80px, 22vw, 130px);
		}
		.node .tag {
			top: calc(50% - 38px);
			font-size: 12px;
			letter-spacing: 0.22em;
		}
		.sheet {
			border: none;
		}
	}

	@media (max-width: 680px) {
		.rail-band {
			height: 44vh;
			height: 44dvh;
			padding: clamp(18px, 2.6vh, 26px) 18px;
		}
		.rail-fit {
			gap: 11px;
		}
		.past-rail .rail-fit,
		.present-rail .rail-fit,
		.future-rail .rail-fit {
			gap: 9px;
		}

		.intro-hero-h {
			font-size: clamp(29px, 8.6vw, 38px);
			margin-bottom: 12px;
		}
		.band-line br.mbr {
			display: inline;
		}
		.rail-sub {
			font-size: 11px;
			letter-spacing: 0.04em;
			text-wrap: balance;
		}
		.intro-hero-copy {
			margin-bottom: 6px;
		}
		.band-line {
			font-size: 14.5px;
			line-height: 1.35;
		}

		.past-rail .h,
		.present-rail .h,
		.future-rail .h {
			font-size: clamp(29px, 8.6vw, 38px);
		}
		.museum-title {
			white-space: normal;
		}
		.past-rail .copy,
		.present-rail .copy,
		.future-rail .copy {
			font-size: 14px;
			line-height: 1.35;
			margin-top: 10px;
			white-space: normal;
		}
		.rail-band .copy br {
			display: none;
		}
		.rail-band .copy,
		.band-line {
			text-wrap: pretty;
		}

		.tl-point {
			min-height: 44px;
			padding: 7px 0;
			gap: 12px;
			border-bottom-color: rgba(236, 236, 228, 0.12);
		}
		.tl-point .tl-label {
			font-size: 15px;
		}
		.rail-tail-fit {
			gap: 10px;
		}
		.cover-rail .timeline {
			display: none;
		}
		.scroll-hint {
			font-size: 11px;
			letter-spacing: 0.14em;
		}
		.past-rail .cta,
		.present-rail .cta,
		.future-rail .cta {
			padding: 13px 20px;
			font-size: 11px;
		}
	}

</style>
