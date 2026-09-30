<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { navBridge } from "$lib/nav-bridge.svelte.js";
    import {
        CHOICE_TIME,
        METRICS,
        SCENES,
        SRC_URLS,
        FOCUS,
        vid,
        clamp,
    } from "$lib/choices/amanda/film.js";
    import {
        initAudio,
        sfxArm,
        sfxCommit,
        sfxKey,
    } from "$lib/choices/amanda/sfx.js";
    import IntroScreen from "$lib/choices/amanda/IntroScreen.svelte";
    import ChoiceScreen from "$lib/choices/amanda/ChoiceScreen.svelte";
    import FilmHud from "$lib/choices/amanda/FilmHud.svelte";
    import { createReframe } from "$lib/choices/amanda/reframe.js";
    import { AMANDA_REFRAME } from "$lib/choices/amanda/reframe-data.js";
    import MiniReadout from "$lib/choices/amanda/MiniReadout.svelte";
    import OutcomeScreen from "$lib/choices/amanda/OutcomeScreen.svelte";
    import EndingScreen from "$lib/choices/amanda/EndingScreen.svelte";

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

    let filmOn = $state(false);
    let filmFrozen = $state(false);
    let filmPos = $state("");
    let bgOpacity = $state(null);
    let ambientOn = $state(false);
    let ambientReveal = $state(false);
    let paused = $state(false);
    let muted = $state(false);

    let cScene = $state(""),
        cTitle = $state(""),
        cPrompt = $state("");
    let cA = $state(""),
        cB = $state("");
    let cTimeText = $state("CHOOSE");
    let timerScale = $state(1);
    let armedOpt = $state("");

    let oHead = $state("");
    let oTyping = $state(false);
    let oWhy = $state("");
    let oSrc = $state(null);
    let overrideOn = $state(false);

    let mhNote = $state("");
    let endDash = $state(null);

    let filmEl, filmbgEl, ambientEl, mini;
    let dashEl = $state(null);
    let outcomeEl = $state(null);
    let portraitMQ, reframe;

    let idx = 0,
        choiceArmed = false,
        timerRAF = null,
        fallbackTimer = null,
        loaderTimer = null,
        typingTimer = null;
    let M = {},
        profile = 0,
        dp = 0;
    const ledger = [];
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

    function resetState() {
        M = {};
        METRICS.forEach((m) => (M[m.key] = m.start));
        profile = 6;
        dp = 0;
        ledger.length = 0;
    }
    resetState();

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
        brPre = [...(S.A.clips || []), ...(S.B.clips || [])].map((c) =>
            hiddenVideo(vid(c)),
        );
    }
    function preloadScene(i) {
        const S = SCENES[i];
        if (!S || !S.clip) return;
        if (preloader) killVideo(preloader);
        preloader = hiddenVideo(vid(S.clip));
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

    function bgSet(src) {
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
        const key = (src || "").split("/").pop().replace(".mp4", "");
        const x = FOCUS[key];
        const fallback = portraitMQ.matches && x != null ? x + "% 50%" : "";
        if (reframe) reframe.set(AMANDA_REFRAME[key], fallback);
        else filmPos = fallback;
    }
    function bgShow(on) {
        bgOpacity = on && portraitMQ.matches ? "1" : "0";
    }
    function bgPlay() {
        bgSync();
        bgShow(true);
        filmbgEl.play()?.catch?.(() => {});
    }
    function bgPause() {
        try {
            filmbgEl.pause();
        } catch {}
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
        const src = vid(name);
        cutTo(() => {
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
                rollClip(cb);
            };
            filmEl.onloadeddata = go;
            filmEl.oncanplay = go;
            filmEl.onerror = () => {
                hideLoader();
                filmOn = true;
                filmFrozen = true;
                cb();
            };
            fallbackTimer = later(() => {
                if (filmEl.readyState < 2) {
                    hideLoader();
                    filmOn = true;
                    filmFrozen = true;
                    cb();
                }
            }, 9000);
        });
    }
    function rollClip(cb) {
        hideLoader();
        if (filmEl.currentTime > 0.5) filmEl.currentTime = 0;
        filmFrozen = false;
        filmOn = true;
        filmEl.muted = muted;
        filmEl.volume = 1;
        filmEl.play()?.catch?.(() => {
            muted = true;
            filmEl.muted = true;
            filmEl.play().catch(() => {});
        });
        bgPlay();
        filmEl.ontimeupdate = bgSync;
        filmplaying = true;
        filmEl.onended = () => {
            filmEl.pause();
            bgPause();
            filmEl.ontimeupdate = null;
            filmplaying = false;
            filmFrozen = true;
            cb();
        };
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

    function begin() {
        initAudio();
        stopAmbient();
        introOn = false;
        playing = true;
        navBridge.pillOpacity = "0";
        navBridge.pillEvents = "none";
        resetState();
        mini.reset();
        mini.sync(M);
        mini.animate(profile);
        playScene(0);
    }

    function armChoice(i) {
        if (choiceArmed) return;
        choiceArmed = true;
        const S = SCENES[i];
        cScene = "Moment " + S.tag;
        cTitle = S.title;
        cPrompt = S.prompt;
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
        const start = performance.now();
        const step = (now) => {
            const el = (now - start) / 1000,
                remain = Math.max(0, CHOICE_TIME - el);
            timerScale = remain / CHOICE_TIME;
            const urg = remain <= CHOICE_TIME * 0.35;
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
        METRICS.forEach((m) => {
            if (o.hit && o.hit[m.key] != null)
                M[m.key] = clamp(M[m.key] + o.hit[m.key]);
        });
        profile = clamp(profile + (o.profile || 0));
        dp += o.dp || 0;
        ledger.push({ n: S.n, label: o.label, src: o.src || "" });
        mini.animate(profile);
        mini.sync(M, o.hit || {});
        sfxCommit();
        armedOpt = which;
        later(() => {
            hideChoice();
            playClipSeq(o.clips, () => showOutcome(S, o, auto));
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

    function showOutcome(S, o, auto) {
        oWhy = o.why || "";
        oSrc = o.src ? { name: o.src, url: SRC_URLS[o.src] } : null;
        overrideOn = !!auto;
        if (outcomeEl) outcomeEl.scrollTop = 0;
        outcomeOn = true;
        reporting = true;
        mini.sync(M, o.hit || {});
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
        idx++;
        idx >= SCENES.length ? ending() : playScene(idx);
    }
    function hideOutcome() {
        outcomeOn = false;
        reporting = false;
        overrideOn = false;
    }

    function skipStep() {
        if (outcomeOn) {
            advance();
            return;
        }
        if (filmplaying && filmEl.duration && isFinite(filmEl.duration)) {
            if (filmEl.paused) filmEl.play().catch(() => {});
            filmEl.currentTime = Math.max(0, filmEl.duration - 0.05);
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
        filmOn = false;
        filmplaying = false;
        playing = false;
        const sources = [];
        ledger.forEach((e) => {
            if (e.src && !sources.includes(e.src)) sources.push(e.src);
        });
        const startVals = {};
        METRICS.forEach((m) => (startVals[m.key] = m.start));
        endDash = {
            title: "Five weeks later",
            sub: "Amanda · the full file",
            heroLine:
                "She never posted anything she regretted. It made no difference.",
            footL: "5 moments",
            footR: "0 refusals honoured",
            sources,
            from: startVals,
            to: { ...M },
        };
        endingOn = true;
        const p = profile,
            d = dp;
        later(() => dashEl?.play(6, p, 0, d), 250);
    }
    function replay() {
        idx = 0;
        resetState();
        mini.reset();
        mini.sync(M);
        endingOn = false;
        playing = true;
        mini.animate(profile);
        playScene(0);
    }
    function shareX() {
        const site = location.origin + location.pathname;
        const rows = ledger.map((e) => e.n + " · " + e.label).join("\n");
        const text =
            "I never posted anything I regretted.\nFive weeks later: profile " +
            profile +
            "% complete, " +
            dp.toLocaleString("en-GB") +
            " data points on file.\n\n" +
            rows +
            "\n\nEvery figure is real. Exit the loop 👇";
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

        portraitMQ = window.matchMedia("(max-aspect-ratio: 5/7)");
        const onMQ = () => {
            bgShow(filmOn);
            applyFocus(filmEl.currentSrc || filmEl.getAttribute("src"));
        };
        portraitMQ.addEventListener("change", onMQ);
        reframe = createReframe(
            filmEl,
            (p) => (filmPos = p),
            () => portraitMQ.matches,
        );

        const done = () => (fontsIn = true);
        if (document.fonts?.ready) {
            document.fonts.ready.then(() => {
                if (alive) done();
            });
            later(done, 1500);
        } else done();

        ambientEl.src = vid("ambient");
        startAmbient();
        later(() => preloadScene(0), 700);
        later(
            () =>
                typeText(
                    (t) => (mhNote = t),
                    null,
                    "Amanda is fiction. The data is real.",
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
            brPre.forEach(killVideo);
            if (preloader) killVideo(preloader);
            try {
                filmEl.pause();
                filmbgEl.pause();
            } catch {}
        };
    });
</script>

<svelte:head>
    <title>LIFE · Amanda · An Interactive Film</title>
    <meta
        name="description"
        content="You are Amanda. Five ordinary moments. The clock is always running. Hesitate, and the system chooses for you."
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
            <video
                id="film"
                bind:this={filmEl}
                playsinline
                preload="auto"
                class:on={filmOn}
                class:frozen={filmFrozen}
                style:object-position={filmPos}
                onplay={() => (paused = false)}
                onpause={() => (paused = true)}
            ></video>
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
            title="You are Amanda."
            cta="Begin"
            onbegin={begin}
            onhover={(h) => (ambientReveal = h)}
            >Five ordinary moments. A filter, a feed, a post, a video, a
            symptom. <span class="q"
                >The clock is always running, and if you freeze, it decides for
                you.</span
            ></IntroScreen
        >

        <ChoiceScreen
            on={choiceOn}
            {urgent}
            scene={cScene}
            title={cTitle}
            prompt={cPrompt}
            a={cA}
            b={cB}
            timeText={cTimeText}
            armed={armedOpt}
            {timerScale}
            onpick={pick}
        />

        <OutcomeScreen
            on={outcomeOn}
            head={oHead}
            typing={oTyping}
            why={oWhy}
            src={oSrc}
            override={overrideOn}
            onnext={advance}
            bind:el={outcomeEl}
        />

        <EndingScreen
            on={endingOn}
            dash={endDash}
            bind:dashEl
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

        <MiniReadout
            bind:this={mini}
            show={reporting || (playing && !choosing)}
            raised={reporting}
        />
        <div id="loader" class:on={loaderOn}><div class="ldr"></div></div>
        <div class="shell-frame" aria-hidden="true"></div>
    </div>
</div>

<style>
    :global(body.choices-film) {
        background: #e2e0c9;
        overflow: hidden;
    }
    .root {
        --ok: #ecece4;
        --warn: #e9c46a;
        --bad: #ef4b3c;
        --good: #8fd694;
        --code: "Fira Mono", ui-monospace, monospace;
        --intro-veil: radial-gradient(
            120% 90% at 50% 46%,
            rgba(6, 8, 7, 0.4) 0%,
            rgba(6, 8, 7, 0.72) 62%,
            rgba(6, 8, 7, 0.9) 100%
        );
        --intro-sub-ls: normal;
        --panel-h: 206px;
        --film-top: 78px;
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
        overflow: hidden;
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
    }

    #stage {
        position: absolute;
        inset: 0;
        z-index: 5;
        background: var(--ink);
        overflow: hidden;
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
        #film {
            object-fit: cover;
            inset: auto 0 auto 0;
            top: var(--film-top);
            transform: none;
            width: 100%;
            height: calc(100% - var(--film-top) - var(--panel-h));
        }
    }
    @media (max-width: 680px) {
        .root {
            --film-top: 90px;
        }
    }
    @media (max-aspect-ratio: 5/7) and (max-height: 700px) {
        .root {
            --panel-h: 172px;
        }
    }
    #film.frozen {
        filter: blur(16px) brightness(0.5) saturate(0.85) !important;
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

    .muted-hint {
        position: absolute;
        bottom: 22px;
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
