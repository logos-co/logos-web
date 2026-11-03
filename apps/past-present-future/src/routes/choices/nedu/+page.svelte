<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { navBridge } from "$lib/nav-bridge.svelte.js";
    import { SCENES, choiceTime, srcOf, vid } from "$lib/choices/nedu/film.js";
    import { createLedger, naira, verdict } from "$lib/choices/nedu/ledger.js";
    import { initAudio, sfxArm, sfxCommit, sfxKey } from "$lib/choices/nedu/sfx.js";
    import IntroScreen from "$lib/choices/nedu/IntroScreen.svelte";
    import ChoiceScreen from "$lib/choices/nedu/ChoiceScreen.svelte";
    import FilmHud from "$lib/choices/nedu/FilmHud.svelte";
    import { createReframe } from "$lib/choices/nedu/reframe.js";
    import { framingFor } from "$lib/choices/nedu/framing.js";
    import AgeBar from "$lib/choices/nedu/AgeBar.svelte";
    import OutcomeScreen from "$lib/choices/nedu/OutcomeScreen.svelte";
    import EndingScreen from "$lib/choices/nedu/EndingScreen.svelte";

    const AGES = SCENES.map((S) => S.age);

    let introOn = $state(true);
    let endingOn = $state(false);
    let playing = $state(false);
    let filmplaying = $state(false);
    let choosing = $state(false);
    let reporting = $state(false);
    let choiceOn = $state(false);
    let urgent = $state(false);
    let outcomeOn = $state(false);
    let loaderOn = $state(false);
    let flashBlack = $state(false);
    let fontsIn = $state(false);
    let needTap = $state(false);

    let filmOn = $state(false);
    let filmCut = $state(false);
    let filmFrozen = $state(false);
    /* portrait framing: how far the window has moved across the film, 0 to 100, or null for centred.
       Moved with a transform, which the GPU composites without repainting the playing video. */
    let filmShift = $state(null);
    let filmBox;
    let bgOpacity = $state(null);
    let ambientOn = $state(false);
    let ambientReveal = $state(false);
    let paused = $state(false);
    let muted = $state(false);

    let idx = $state(0);
    let cScene = $state(""),
        cSetup = $state(""),
        cTitle = $state("");
    let cA = $state(""),
        cB = $state("");
    let cTimeText = $state("CHOOSE");
    let timerScale = $state(1);
    let armedOpt = $state("");

    let oHead = $state("");
    let oTyping = $state(false);
    let oWhy = $state("");
    let oSrc = $state(null);
    let oEntry = $state(null);
    let overrideOn = $state(false);

    let mhNote = $state("");
    let endData = $state(null);
    let endVerdict = $state({ stamp: "", stampSub: "" });
    let endSources = $state([]);

    const L = createLedger();
    let sheetData = $state(L.snapshot());

    let filmEl, filmbgEl, ambientEl, bar, outcome, endScreen;
    let portraitMQ, reframe;
    let ext = ".mp4";

    let choiceArmed = false,
        timerRAF = null,
        fallbackTimer = null,
        loaderTimer = null,
        typingTimer = null;
    let brPre = [],
        preloader = null;
    let alive = false;
    const timeouts = new Set();
    function later(fn, ms) {
        const t = setTimeout(() => {
            timeouts.delete(t);
            if (alive) fn();
        }, ms);
        timeouts.add(t);
        return t;
    }
    const clip = (name) => vid(name, ext);

    function resetState() {
        L.reset();
        sheetData = L.snapshot();
        bar?.reset();
    }

    function cutTo(fn) {
        flashBlack = true;
        later(() => {
            fn();
            later(() => (flashBlack = false), 120);
        }, 200);
    }

    function killVideo(v) {
        try {
            v.removeAttribute("src");
            v.load();
            v.remove();
        } catch {}
    }
    function hiddenVideo(src) {
        const v = document.createElement("video");
        v.preload = "auto";
        v.muted = true;
        v.playsInline = true;
        v.style.cssText =
            "position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none";
        v.src = src;
        document.body.appendChild(v);
        return v;
    }
    function preloadBrolls(S) {
        brPre.forEach(killVideo);
        brPre = [...S.A.clips, ...S.B.clips].map((c) => hiddenVideo(clip(c)));
    }
    function preloadScene(i) {
        const S = SCENES[i];
        if (!S) return;
        if (preloader) killVideo(preloader);
        preloader = hiddenVideo(clip(S.clip));
    }
    /* Chrome serialises fetches of one URL: while a hidden preload <video>
       still holds it, the real film request waits behind it. Drop every
       preloader the moment a clip is about to play. Whatever they already
       pulled stays in the HTTP cache. */
    function releasePreloads() {
        brPre.forEach(killVideo);
        brPre = [];
        if (preloader) killVideo(preloader);
        preloader = null;
    }

    function showLoaderSoon() {
        clearTimeout(loaderTimer);
        loaderTimer = later(() => (loaderOn = true), 350);
    }
    function hideLoader() {
        clearTimeout(loaderTimer);
        loaderOn = false;
    }

    function togglePP() {
        if (filmEl.ended) return;
        if (filmEl.paused) {
            filmEl.play().catch(() => {});
            bgPlay();
        } else {
            filmEl.pause();
            bgPause();
        }
    }
    function toggleMute() {
        muted = !muted;
        filmEl.muted = muted;
    }

    /* the blurred copy behind the film only shows in portrait. Elsewhere it would fetch every clip twice. */
    function bgSet(src) {
        if (!portraitMQ.matches) return;
        try {
            if (filmbgEl.getAttribute("src") !== src) {
                filmbgEl.src = src;
                filmbgEl.load();
            }
        } catch {}
    }
    function bgSync() {
        try {
            if (Math.abs((filmbgEl.currentTime || 0) - filmEl.currentTime) > 0.25)
                filmbgEl.currentTime = filmEl.currentTime;
        } catch {}
    }
    function applyFocus(src) {
        const key = (src || "").split("/").pop().replace(/\.(mp4|webm)$/, "");
        reframe?.set(framingFor(key));
    }
    function bgShow(on) {
        bgOpacity = on && portraitMQ.matches ? "1" : "0";
    }
    function bgPlay() {
        if (!portraitMQ.matches) return;
        bgSync();
        bgShow(true);
        filmbgEl.play()?.catch?.(() => {});
    }
    function bgPause() {
        try {
            filmbgEl.pause();
        } catch {}
    }

    /* every route out of a clip lands here exactly once: ended, error,
       stall, or SKIP. Seeking to the end is not reliable on these longer
       scenes (the seek target is often past what has buffered), so SKIP
       ends the clip directly. */
    let pendingCb = null,
        clipToken = 0;
    function finishClip() {
        const cb = pendingCb;
        pendingCb = null;
        if (!cb) return;
        clipToken++;
        filmEl.onended = filmEl.onerror = filmEl.onloadeddata = filmEl.oncanplay = null;
        filmEl.ontimeupdate = null;
        clearTimeout(fallbackTimer);
        hideLoader();
        needTap = false;
        try {
            filmEl.pause();
        } catch {}
        bgPause();
        filmplaying = false;
        filmFrozen = true;
        cb();
    }
    function playClipSeq(list, cb) {
        let i = 0;
        const next = () => {
            if (i >= list.length) {
                cb();
                return;
            }
            playClip(list[i++], next);
        };
        next();
    }
    function playClip(name, cb) {
        clearTimeout(fallbackTimer);
        releasePreloads();
        pendingCb = cb;
        const mine = ++clipToken;
        const src = clip(name);
        cutTo(() => {
            /* SKIP landed inside the black flash: do not start the clip under the next screen */
            if (mine !== clipToken || pendingCb !== cb) return;
            /* drop the old frame instantly, no cross-fade between clips */
            filmCut = true;
            filmOn = false;
            filmFrozen = false;
            filmEl.ontimeupdate = filmEl.onended = null;
            filmEl.src = src;
            filmEl.currentTime = 0;
            filmEl.loop = false;
            filmEl.load();
            bgSet(src);
            applyFocus(src);
            showLoaderSoon();
            let started = false;
            const go = () => {
                if (started) return;
                started = true;
                clearTimeout(fallbackTimer);
                rollClip();
            };
            filmEl.onloadeddata = go;
            filmEl.oncanplay = go;
            filmEl.onerror = () => {
                filmOn = true;
                finishClip();
            };
            fallbackTimer = later(() => {
                if (filmEl.readyState < 2) {
                    filmOn = true;
                    finishClip();
                }
            }, 20000);
        });
    }
    function rollClip() {
        hideLoader();
        if (filmEl.currentTime > 0.5) filmEl.currentTime = 0;
        filmCut = false;
        filmFrozen = false;
        filmOn = true;
        filmEl.muted = muted;
        filmEl.volume = 1;
        /* iOS refuses autoplay with sound: fall back to muted, and the mute button says so.
           Low Power Mode refuses even that: ask for one tap instead of hanging.
           Only a refusal counts. SKIP pausing a pending play() rejects too (AbortError). */
        const mine = clipToken;
        const refused = (e) => e?.name === "NotAllowedError" && mine === clipToken;
        filmEl.play()?.catch?.((e) => {
            if (!refused(e)) return;
            muted = true;
            filmEl.muted = true;
            filmEl.play().catch((e2) => {
                if (refused(e2)) needTap = true;
            });
        });
        bgPlay();
        filmEl.ontimeupdate = bgSync;
        filmplaying = true;
        filmEl.onended = finishClip;
    }
    function tapToPlay() {
        needTap = false;
        filmEl.play().catch(() => (needTap = true));
        bgPlay();
    }

    function playScene(i) {
        idx = i;
        choiceArmed = false;
        hideChoice();
        hideOutcome();
        playClip(SCENES[i].clip, () => armChoice(i));
    }

    function startAmbient() {
        ambientOn = true;
        ambientEl.play()?.catch?.(() => {});
    }
    function stopAmbient() {
        ambientOn = false;
        try {
            ambientEl.pause();
            ambientEl.removeAttribute("src");
            ambientEl.load();
        } catch {}
    }

    /* one intro (Jack, 26 Oct): Begin goes straight to scene 1, no framing screen */
    function begin() {
        initAudio();
        stopAmbient();
        introOn = false;
        playing = true;
        navBridge.pillOpacity = "0";
        navBridge.pillEvents = "none";
        resetState();
        bar.animate(0);
        playScene(0);
    }

    function armChoice(i) {
        if (choiceArmed) return;
        choiceArmed = true;
        const S = SCENES[i];
        cScene = S.tag + " · AGE\u00a0" + S.age;
        cSetup = S.setup;
        cTitle = S.title;
        cA = S.A.label;
        cB = S.B.label;
        cTimeText = "CHOOSE";
        urgent = false;
        armedOpt = "";
        timerScale = 1;
        choosing = true;
        preloadBrolls(S);
        choiceOn = true;
        sfxArm();
        startTimer();
    }
    function startTimer() {
        cancelTimer();
        const start = performance.now(),
            T = choiceTime(idx);
        const step = (now) => {
            const remain = Math.max(0, T - (now - start) / 1000);
            timerScale = remain / T;
            const urg = remain <= T * 0.35;
            if (urg) urgent = true;
            cTimeText = urg ? "DECIDE · " + Math.ceil(remain) + "s" : "CHOOSE";
            if (remain <= 0) {
                autoPick();
                return;
            }
            timerRAF = requestAnimationFrame(step);
        };
        timerRAF = requestAnimationFrame(step);
    }
    function cancelTimer() {
        if (timerRAF) cancelAnimationFrame(timerRAF);
        timerRAF = null;
    }
    function hideChoice() {
        choiceOn = false;
        urgent = false;
        choosing = false;
    }

    function pick(which, auto = false) {
        if (!choiceArmed) return;
        choiceArmed = false;
        cancelTimer();
        const S = SCENES[idx],
            o = S[which];
        const e = L.pick(S, which);
        sheetData = L.snapshot();
        bar.animate(L.unaccounted());
        sfxCommit();
        armedOpt = which;
        later(() => {
            hideChoice();
            /* the b-roll for the choice plays before every outcome */
            playClipSeq(o.clips, () => showOutcome(S, o, e, auto));
        }, 260);
    }
    function autoPick() {
        cancelTimer();
        pick(Math.random() < 0.5 ? "A" : "B", true);
    }
    function onKeydown(e) {
        if (!choiceOn || !choiceArmed) return;
        if (e.key === "a" || e.key === "A") pick("A");
        if (e.key === "b" || e.key === "B") pick("B");
    }

    function typeText(set, setTyping, text, silent) {
        clearTimeout(typingTimer);
        set("");
        setTyping?.(true);
        let i = 0;
        const step = () => {
            if (i >= text.length) {
                setTyping?.(false);
                return;
            }
            i++;
            set(text.slice(0, i));
            if (!silent && text[i - 1] !== " " && i % 2 === 0) sfxKey();
            typingTimer = later(step, 34);
        };
        step();
    }

    function showOutcome(S, o, e, auto) {
        oWhy = o.why || "";
        oSrc = srcOf(o.src);
        oEntry = e;
        overrideOn = !!auto;
        outcome.reset();
        outcomeOn = true;
        reporting = true;
        preloadScene(idx + 1);
        typeText(
            (t) => (oHead = t),
            (t) => (oTyping = t),
            o.head || "",
            false,
        );
    }
    function advance() {
        hideOutcome();
        idx >= SCENES.length - 1 ? ending() : playScene(idx + 1);
    }
    function hideOutcome() {
        outcomeOn = false;
        reporting = false;
        overrideOn = false;
    }

    function skipStep() {
        if (outcomeOn) {
            outcome.next();
            return;
        }
        if (pendingCb) {
            finishClip();
            return;
        }
        if (choiceArmed) autoPick();
    }

    function ending() {
        hideChoice();
        hideOutcome();
        try {
            filmEl.pause();
        } catch {}
        bgPause();
        bgShow(false);
        filmOn = false;
        filmplaying = false;
        playing = false;
        const snap = L.snapshot();
        endVerdict = verdict(snap.entries);
        endSources = [...new Set(snap.entries.map((e) => e.src).filter(Boolean))].map(srcOf);
        endData = snap;
        endingOn = true;
        endScreen.start();
    }
    function replay() {
        resetState();
        endingOn = false;
        playing = true;
        bar.animate(0);
        playScene(0);
    }
    function shareX() {
        const site = location.origin + location.pathname;
        const rows = L.entries.map((e) => e.age + " · " + e.label).join("\n");
        const text =
            "I never broke a law.\nEighteen years later: " +
            naira(L.unaccounted()) +
            " unaccounted for, " +
            L.M.cleared +
            "% of the canal cleared.\n\n" +
            rows +
            "\n\nEvery figure is real. Exit the system 👇";
        window.open(
            "https://twitter.com/intent/tweet?text=" +
                encodeURIComponent(text) +
                "&url=" +
                encodeURIComponent(site),
            "_blank",
            "noopener",
        );
    }

    onMount(() => {
        alive = true;
        document.body.classList.add("choices-film");

        navBridge.onNav = (era) => {
            if (era === "past") goto(`${base}/museum-of-civil-liberties`);
            else if (era === "present") goto(`${base}/choices`);
            else if (era === "future") goto(`${base}/?to=future`);
        };

        if (document.createElement("video").canPlayType('video/webm; codecs="vp9, opus"'))
            ext = ".webm";

        portraitMQ = window.matchMedia("(max-aspect-ratio: 5/7)");
        const onMQ = () => {
            if (filmOn) {
                bgSet(filmEl.currentSrc || filmEl.getAttribute("src"));
                bgPlay();
            }
            bgShow(filmOn);
            applyFocus(filmEl.currentSrc || filmEl.getAttribute("src"));
        };
        portraitMQ.addEventListener("change", onMQ);
        /* follows the speaker wherever much of the frame is cut off: portrait phones, but also
           tablets held upright, where the film fills the frame and shows only its middle */
        reframe = createReframe(
            filmEl,
            (p) => (filmShift = p ? parseFloat(p) : null),
            undefined,
            filmBox,
            true,
        );

        const done = () => (fontsIn = true);
        if (document.fonts?.ready) {
            document.fonts.ready.then(() => {
                if (alive) done();
            });
            later(done, 1500);
        } else done();

        ambientEl.src = clip("ambient");
        startAmbient();
        later(() => preloadScene(0), 700);
        later(
            () =>
                typeText(
                    (t) => (mhNote = t),
                    null,
                    "Nedu is fiction. The data is real.",
                    true,
                ),
            750,
        );

        return () => {
            alive = false;
            document.body.classList.remove("choices-film");
            navBridge.onNav = null;
            navBridge.pillOpacity = null;
            navBridge.pillEvents = null;
            portraitMQ.removeEventListener("change", onMQ);
            reframe.destroy();
            cancelTimer();
            timeouts.forEach(clearTimeout);
            releasePreloads();
            try {
                filmEl.pause();
                filmbgEl.pause();
            } catch {}
        };
    });
</script>

<svelte:head>
    <title>LIFE · Nedu · An Interactive Film</title>
    <meta
        name="description"
        content="You are Nedu. Eighteen years, five decisions, one canal. Hesitate, and the room decides for you."
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
    <link
        href="https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;500&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<svelte:window onkeydown={onKeydown} />

<div class="root choices-scope" class:playing>
    <div id="shell">
        <div id="stage">
            <video
                id="ambient"
                aria-hidden="true"
                bind:this={ambientEl}
                muted
                loop
                autoplay
                playsinline
                preload="auto"
                class:on={ambientOn}
                class:reveal={ambientReveal}
            ></video>
            <video
                id="filmbg"
                bind:this={filmbgEl}
                playsinline
                preload="auto"
                muted
                aria-hidden="true"
                style:opacity={bgOpacity}
            ></video>
            <div class="film-box" bind:this={filmBox}>
                <video
                    id="film"
                    bind:this={filmEl}
                    playsinline
                    preload="auto"
                    class:on={filmOn}
                    class:cut={filmCut}
                    class:frozen={filmFrozen}
                    class:framed={filmShift != null}
                    style:transform={filmShift == null
                        ? null
                        : `translate3d(calc((100cqw - 100%) * ${filmShift / 100}), 0, 0)`}
                    onplay={() => {
                        paused = false;
                        needTap = false;
                    }}
                    onpause={() => (paused = true)}
                ></video>
            </div>
        </div>

        <div class="vignette" aria-hidden="true"></div>
        <div class="scan" aria-hidden="true"></div>
        <div class="grain grain-fx" aria-hidden="true"></div>
        <div id="flash" class:black={flashBlack} aria-hidden="true"></div>

        <FilmHud
            variant="amanda"
            showControls={filmplaying}
            showMute={playing}
            showSkip={playing}
            {paused}
            {muted}
            onplaypause={togglePP}
            onmute={toggleMute}
            onskip={skipStep}
        />

        <IntroScreen
            on={introOn}
            {fontsIn}
            title="You are Nedu."
            cta="Begin"
            onbegin={begin}
            onhover={(h) => (ambientReveal = h)}
            >See how the system works against everyone, even when you’re trying
            to do the right thing. <span class="q"
                >The choices are yours. The corruption is the system’s.</span
            ></IntroScreen
        >

        <ChoiceScreen
            on={choiceOn}
            {urgent}
            scene={cScene}
            setup={cSetup}
            title={cTitle}
            a={cA}
            b={cB}
            timeText={cTimeText}
            armed={armedOpt}
            {timerScale}
            onpick={pick}
        />

        <OutcomeScreen
            bind:this={outcome}
            on={outcomeOn}
            head={oHead}
            typing={oTyping}
            why={oWhy}
            entry={oEntry}
            src={oSrc}
            override={overrideOn}
            data={sheetData}
            onnext={advance}
        />

        <EndingScreen
            bind:this={endScreen}
            on={endingOn}
            data={endData}
            stamp={endVerdict.stamp}
            stampSub={endVerdict.stampSub}
            sources={endSources}
            onreplay={replay}
            onshare={shareX}
        />

        <div class="muted-hint" class:hidden={endingOn}>
            <span class="mh-sound"
                ><svg
                    class="hp"
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    ><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect
                        x="2.5"
                        y="14"
                        width="4"
                        height="6"
                        rx="1.2"
                    /><rect
                        x="17.5"
                        y="14"
                        width="4"
                        height="6"
                        rx="1.2"
                    /></svg
                > Sound on. Every scene is spoken.</span
            >
            <span class="mh-note">{mhNote}</span>
        </div>

        <AgeBar bind:this={bar} show={playing && !choosing && !reporting} ages={AGES} {idx} />
        <div id="loader" class:on={loaderOn}><div class="ldr"></div></div>
        {#if needTap}
            <button class="tap-play" onclick={tapToPlay}>▶ Tap to play</button>
        {/if}
        <div class="shell-frame" aria-hidden="true"></div>
    </div>
</div>

<style>
    :global(body.choices-film) {
        background: #e2e0c9;
        overflow: hidden;
    }
    .root {
        --bad: #ef4b3c;
        --code: "Fira Mono", ui-monospace, monospace;
        --intro-veil: radial-gradient(
            120% 90% at 50% 46%,
            rgba(6, 8, 7, 0.4) 0%,
            rgba(6, 8, 7, 0.72) 62%,
            rgba(6, 8, 7, 0.9) 100%
        );
        --intro-sub-ls: normal;
        /* portrait: the film sits between the nav and the age bar */
        --film-top: 78px;
        --panel-h: calc(96px + env(safe-area-inset-bottom, 0px));
        color: var(--paper);
        font-family: var(--sans);
        -webkit-font-smoothing: antialiased;
    }

    #shell {
        position: fixed;
        inset: 16px;
        z-index: 0;
        background: var(--ink);
        border-radius: 48px;
        overflow: clip;
        clip-path: inset(0 round 48px);
        height: calc(100dvh - 32px);
        box-shadow:
            0 30px 80px rgba(20, 17, 13, 0.28),
            0 2px 0 rgba(255, 255, 255, 0.04) inset;
    }
    .shell-frame {
        position: absolute;
        inset: 0;
        z-index: 62;
        pointer-events: none;
        border-radius: 48px;
        border: 1px solid rgba(236, 236, 228, 0.1);
    }
    @media (max-width: 680px) {
        #shell {
            inset: 10px;
            border-radius: 30px;
            clip-path: inset(0 round 30px);
            height: calc(100dvh - 20px);
        }
        .shell-frame {
            border-radius: 30px;
        }
        .root {
            --film-top: 90px;
            --panel-h: calc(84px + env(safe-area-inset-bottom, 0px));
        }
    }

    #stage {
        position: absolute;
        inset: 0;
        z-index: 5;
        background: var(--ink);
        overflow: hidden;
    }
    .film-box {
        position: absolute;
        inset: 0;
        z-index: 1;
        overflow: hidden;
        container-type: size;
    }
    #film {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        max-width: none;
        object-fit: cover;
        opacity: 0;
        transition:
            opacity 0.6s ease,
            filter 1.4s ease;
        background: transparent;
        z-index: 1;
    }
    #film.on {
        opacity: 1;
    }
    /* the whole film at the window's height, slid across by the transform */
    #film.framed {
        right: auto;
        width: auto;
        aspect-ratio: 16 / 9;
        object-fit: fill;
        will-change: transform;
    }
    #film.cut {
        transition: none;
    }
    #film.frozen {
        filter: blur(16px) brightness(0.5) saturate(0.85) !important;
    }
    #filmbg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        max-width: none;
        object-fit: cover;
        z-index: 0;
        opacity: 0;
        filter: blur(30px) brightness(0.42) saturate(0.85);
        transform: scale(1.12);
        transition: opacity 0.45s ease;
        pointer-events: none;
    }
    @media (max-aspect-ratio: 5/7) {
        .film-box {
            inset: auto 0 auto 0;
            top: var(--film-top);
            height: calc(100% - var(--film-top) - var(--panel-h));
        }
    }
    #ambient {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        max-width: none;
        object-fit: cover;
        z-index: 2;
        opacity: 0;
        transition:
            opacity 1.2s ease,
            filter 0.7s ease,
            transform 0.7s ease;
        filter: blur(16px) grayscale(1) brightness(0.58) contrast(1.05);
        transform: scale(1.1);
    }
    #ambient.on {
        opacity: 1;
    }
    #ambient.reveal {
        filter: blur(0px) grayscale(0) brightness(0.92) contrast(1);
        transform: scale(1.02);
    }

    .scan {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 40;
        mix-blend-mode: overlay;
        opacity: 0.16;
        background: repeating-linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.06) 0 1px,
            transparent 1px 4px
        );
    }
    .grain {
        position: absolute;
        inset: -50%;
        z-index: 41;
        opacity: 0.1;
    }
    .vignette {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 39;
        background: radial-gradient(
            120% 95% at 50% 45%,
            transparent 42%,
            rgba(0, 0, 0, 0.5) 86%,
            rgba(0, 0, 0, 0.92) 100%
        );
    }
    #flash {
        position: absolute;
        inset: 0;
        z-index: 60;
        background: var(--ink);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.18s ease;
    }
    #flash.black {
        opacity: 1;
    }

    #loader {
        position: absolute;
        inset: 0;
        z-index: 24;
        display: none;
        align-items: center;
        justify-content: center;
        background: #000;
    }
    #loader.on {
        display: flex;
    }
    #loader .ldr {
        width: 120px;
        height: 2px;
        background: rgba(236, 236, 228, 0.16);
        overflow: hidden;
        position: relative;
    }
    #loader .ldr::after {
        content: "";
        position: absolute;
        top: 0;
        left: -45%;
        height: 100%;
        width: 45%;
        background: var(--paper);
        animation: ldrslide 1.1s ease-in-out infinite;
    }
    @keyframes ldrslide {
        0% {
            left: -45%;
        }
        100% {
            left: 105%;
        }
    }

    .tap-play {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 55;
        padding: 16px 28px;
        border: 1px solid rgba(245, 245, 239, 0.55);
        border-radius: 100px;
        background: rgba(6, 8, 7, 0.6);
        color: var(--signal);
        font-family: var(--code);
        font-size: 12px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        cursor: pointer;
        -webkit-backdrop-filter: blur(6px);
        backdrop-filter: blur(6px);
    }

    .muted-hint {
        position: absolute;
        bottom: calc(22px + env(safe-area-inset-bottom, 0px));
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        white-space: nowrap;
        z-index: 50;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }
    .muted-hint .mh-sound {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        font-family: var(--code);
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #fff;
    }
    .muted-hint .hp {
        flex: none;
        animation: spkpulse 1.9s ease-in-out infinite;
    }
    @keyframes spkpulse {
        0%,
        100% {
            opacity: 0.4;
            transform: scale(1);
        }
        50% {
            opacity: 0.9;
            transform: scale(1.15);
        }
    }
    .muted-hint .mh-note {
        font-family: var(--sans);
        font-size: 13px;
        color: #fff;
        min-height: 1.1em;
    }
    .root :global(#intro .sub) {
        max-width: 610px;
    }
    @media (max-height: 420px) {
        .root :global(#intro h1) {
            font-size: 38px;
        }
        .root :global(#intro .sub) {
            margin-top: 12px;
        }
        .root :global(#intro .btn) {
            margin-top: 18px;
        }
        .muted-hint {
            bottom: 14px;
            gap: 2px;
        }
    }
    .root.playing .muted-hint,
    .muted-hint.hidden {
        display: none;
    }
</style>
