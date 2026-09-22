<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { navBridge } from "$lib/nav-bridge.svelte.js";
    import { SCENES, SRC_URLS, CHOICE_TIME } from "$lib/choices/scenes.js";
    import { initAudio, printLineSfx, typeTick } from "$lib/choices/sfx.js";
    import {
        moneyS,
        chapterReceipt,
        finalReceipt,
    } from "$lib/choices/receipt-model.js";
    import IntroScreen from "$lib/choices/mike/IntroScreen.svelte";
    import ChoiceScreen from "$lib/choices/mike/ChoiceScreen.svelte";
    import OutcomeScreen from "$lib/choices/mike/OutcomeScreen.svelte";
    import EndingScreen from "$lib/choices/mike/EndingScreen.svelte";
    import Timeline from "$lib/choices/mike/Timeline.svelte";
    import FilmHud from "$lib/choices/mike/FilmHud.svelte";

    let ext = ".mp4";
    const vidSrc = (name) => `/past-present-future/choices/videos/${name}${ext}`;

    let introOn = $state(true);
    let endingOn = $state(false);
    let playing = $state(false);
    let filmplaying = $state(false);
    let choosing = $state(false);
    let choiceOn = $state(false);
    let urgent = $state(false);
    let outcomeOn = $state(false);
    let loaderOn = $state(false);
    let flashBlack = $state(false);
    let fontsIn = $state(false);

    let filmOn = $state(false);
    let filmFrozen = $state(false);
    let filmBfade = $state(false);
    let gradeFilter = $state("");
    let ambientOn = $state(false);
    let ambientReveal = $state(false);
    let agecardOn = $state(false);
    let ageKey = $state(0);
    let acAge = $state("");
    let paused = $state(false);
    let muted = $state(false);

    let cAge = $state(""),
        cTitle = $state(""),
        cPrompt = $state("");
    let cA = $state(""),
        cB = $state("");
    let cTimeText = $state("CHOOSE");
    let timerScale = $state(1);
    let armedOpt = $state(""); // 'A' | 'B' | ''

    let oDebtGood = $state(true);
    let oDebtText = $state("");
    let oTyping = $state(false);
    let oWhy = $state("");
    let oSrc = $state(null);
    let overrideOn = $state(false);
    let outcomeView = $state("bill"); // 'bill' | 'tally'
    let tallyLines = $state([]);
    let tallyPrintGen = $state(0);
    let endReceiptLines = $state([]);
    let endPrintGen = $state(0);
    const oNextLabel = $derived(
        outcomeView === "bill" ? "See the receipt ►" : "Continue ►",
    );

    let tlIdx = $state(0);
    let tlProg = $state(0);
    let debtShownTxt = $state("£0");
    let indebt = $state(false);
    let tlBumpKey = $state(0);

    let mhNote = $state("");
    let mhTyping = $state(false);

    let filmEl, ambientEl;
    let outcomeEl = $state(null);

    let idx = 0,
        choiceArmed = false,
        timerRAF = null,
        fallbackTimer = null,
        loaderTimer = null,
        ageTimer = null;
    let debtTotal = 0,
        debtShown = 0,
        debtRAF = null;
    let ledger = [];
    let preloaders = [];
    let typingTimer = null;
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

    function showAgeCard(i) {
        const S = SCENES[i];
        if (!S) return;
        acAge = "Age " + S.age;
        agecardOn = true;
        ageKey++;
        clearTimeout(ageTimer);
        ageTimer = later(() => (agecardOn = false), 2700);
    }

    function updateTimeline(i) {
        tlIdx = i;
        tlProg = (i / (SCENES.length - 1)) * 100;
        indebt = debtTotal > 0;
        tlBumpKey++;
    }
    function animateDebt() {
        const start = debtShown,
            end = debtTotal,
            t0 = performance.now(),
            dur = 800;
        if (debtRAF) cancelAnimationFrame(debtRAF);
        const step = (now) => {
            const k = Math.min(1, (now - t0) / dur);
            const v = Math.round(
                start + (end - start) * (1 - Math.pow(1 - k, 3)),
            );
            debtShown = v;
            debtShownTxt = "£" + Math.max(0, v).toLocaleString("en-GB");
            if (k < 1) debtRAF = requestAnimationFrame(step);
        };
        debtRAF = requestAnimationFrame(step);
    }
    function resetDebt() {
        debtTotal = 0;
        debtShown = 0;
        if (debtRAF) cancelAnimationFrame(debtRAF);
        debtShownTxt = "£0";
        indebt = false;
        tlBumpKey = 0;
    }

    function grade(t) {
        gradeFilter = `saturate(${(1 - 0.72 * t).toFixed(2)}) brightness(${(1 - 0.12 * t).toFixed(2)}) contrast(${(1 + 0.06 * t).toFixed(2)})`;
    }

    function showLoaderSoon() {
        clearTimeout(loaderTimer);
        loaderTimer = later(() => (loaderOn = true), 350);
    }
    function hideLoader() {
        clearTimeout(loaderTimer);
        loaderOn = false;
    }

    function cutTo(fn) {
        flashBlack = true;
        later(() => {
            fn();
            later(() => (flashBlack = false), 120);
        }, 200);
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
        playScene(0);
    }

    function togglePP() {
        if (filmEl.paused) filmEl.play().catch(() => {});
        else filmEl.pause();
    }
    function toggleMute() {
        filmEl.muted = !filmEl.muted;
    }

    function loadClip(name, onReady, onFail) {
        filmOn = false;
        filmFrozen = false;
        filmBfade = false;
        filmEl.ontimeupdate = filmEl.onended = null;
        filmEl.src = vidSrc(name);
        filmEl.currentTime = 0;
        filmEl.loop = false;
        filmEl.load();
        showLoaderSoon();
        let started = false;
        const go = () => {
            if (started) return;
            started = true;
            clearTimeout(fallbackTimer);
            onReady();
        };
        filmEl.onloadeddata = go;
        filmEl.oncanplay = go;
        const fail = () => {
            hideLoader();
            filmOn = true;
            filmFrozen = true;
            onFail();
        };
        filmEl.onerror = fail;
        fallbackTimer = later(() => {
            if (filmEl.readyState < 2) fail();
        }, 8000);
    }
    function startPlayback() {
        hideLoader();
        if (filmEl.currentTime > 0.5) filmEl.currentTime = 0;
        filmFrozen = false;
        filmBfade = false;
        filmOn = true;
        filmEl.muted = false;
        filmEl.volume = 1;
        filmEl.play()?.catch?.(() => {
            filmEl.muted = true;
            filmEl.play().catch(() => {});
        });
        filmplaying = true;
    }
    function freezeFrame() {
        filmEl.pause();
        filmEl.ontimeupdate = null;
        filmplaying = false;
        filmFrozen = true;
    }

    function playScene(i) {
        idx = i;
        choiceArmed = false;
        updateTimeline(i);
        hideChoice();
        hideOutcome();
        clearTimeout(fallbackTimer);
        const S = SCENES[i];
        cutTo(() => {
            grade(S.grade || 0);
            loadClip(
                S.clip,
                () => realPlay(i),
                () => afterScene(i),
            );
        });
    }
    function realPlay(i) {
        startPlayback();
        showAgeCard(i);
        filmEl.ontimeupdate = () => {
            if (!filmEl.duration || !isFinite(filmEl.duration)) return;
            const frac = Math.min(1, filmEl.currentTime / filmEl.duration);
            tlProg = Math.min(100, ((i + frac) / (SCENES.length - 1)) * 100);
        };
        filmEl.onended = () => {
            if (!choiceArmed) afterScene(i);
        };
    }
    function afterScene(i) {
        freezeFrame();
        if (SCENES[i].ending) ending();
        else armChoice(i);
    }

    function playBroll(clip, cb) {
        clearTimeout(fallbackTimer);
        cutTo(() => {
            loadClip(
                clip,
                () => {
                    startPlayback();
                    filmEl.ontimeupdate = () => {
                        if (!filmEl.duration || !isFinite(filmEl.duration))
                            return;
                        const rem = filmEl.duration - filmEl.currentTime;
                        if (rem <= 0.6) {
                            filmBfade = true;
                            if (!filmEl.muted)
                                filmEl.volume = Math.max(0, rem / 0.6);
                        }
                    };
                    filmEl.onended = () => {
                        freezeFrame();
                        cb();
                    };
                },
                cb,
            );
        });
    }

    function preloadBrolls(i) {
        preloaders.forEach((v) => {
            try {
                v.removeAttribute("src");
                v.load();
                v.remove();
            } catch {}
        });
        preloaders = [];
        const S = SCENES[i];
        if (!S) return;
        for (const name of [S.A?.clip, S.B?.clip].filter(Boolean)) {
            const v = document.createElement("video");
            v.preload = "auto";
            v.muted = true;
            v.playsInline = true;
            v.style.cssText =
                "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px";
            v.src = vidSrc(name);
            document.body.appendChild(v);
            preloaders.push(v);
        }
    }

    function armChoice(i) {
        if (choiceArmed) return;
        choiceArmed = true;
        const S = SCENES[i];
        cAge = "Age " + S.age;
        cTitle = S.title;
        cPrompt = S.prompt;
        cA = S.A.label;
        cB = S.B.label;
        cTimeText = "CHOOSE";
        urgent = false;
        armedOpt = "";
        timerScale = 1;
        hideAgeCard();
        choosing = true;
        choiceOn = true;
        startTimer();
        preloadBrolls(i);
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

    function pick(which, auto = false) {
        if (!choiceArmed) return;
        choiceArmed = false;
        cancelTimer();
        const S = SCENES[idx],
            o = S[which];
        // Debt still owed at the end (the mortgage) gets its own tab row,
        // so the choice itself isn't blamed for it.
        const owed = (o.bill?.rows || []).filter((r) => r[2] === "owed");
        const owedTotal = owed.reduce((a, r) => a + r[1], 0);
        ledger.push({
            age: S.age,
            to: SCENES[idx + 1]?.age ?? 45,
            label: o.label,
            delta: (o.delta || 0) - owedTotal,
            src: o.src || "",
        });
        for (const r of owed) ledger.push({ age: 45, label: r[0].replace(/ at 45$/, ""), delta: r[1], src: "" });
        armedOpt = which;
        later(() => {
            hideChoice();
            if (o.clip) playBroll(o.clip, () => showOutcome(S, o, auto));
            else showOutcome(S, o, auto);
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
    function hideChoice() {
        choiceOn = false;
        urgent = false;
        choosing = false;
    }

    function typeText(setText, setTyping, text, silent = false) {
        clearTimeout(typingTimer);
        setText("");
        setTyping(true);
        let i = 0;
        const step = () => {
            if (i >= text.length) {
                setTyping(false);
                return;
            }
            const ch = text[i];
            i++;
            setText(text.slice(0, i));
            if (ch !== " " && !silent) typeTick();
            typingTimer = later(step, 60);
        };
        step();
    }

    function showOutcome(S, o, auto) {
        const footMoney = -(o.delta || 0);
        // Tally the debt only once the outcome lands, after the hit types out.
        debtTotal += o.delta || 0;
        later(() => {
            animateDebt();
            indebt = debtTotal > 0;
        }, moneyS(footMoney).length * 60 + 300);
        oDebtGood = footMoney >= 0;
        oWhy = `${o.why || ""} ${o.fact || ""}`.trim(); // one continuous paragraph
        oSrc = o.src ? { name: o.src, url: SRC_URLS[o.src] } : null;
        overrideOn = !!auto;
        tallyLines = chapterReceipt(S, o, ledger, debtTotal);
        tallyPrintGen = 0;
        outcomeView = "bill"; // page 1: the hit + the fact
        outcomeOn = true;
        if (outcomeEl) outcomeEl.scrollTop = 0;
        typeText(
            (t) => (oDebtText = t),
            (t) => (oTyping = t),
            moneyS(footMoney),
        );
    }
    function onNext() {
        if (outcomeView === "bill") {
            outcomeView = "tally"; // page 2: the detailed receipt
            if (outcomeEl) outcomeEl.scrollTop = 0;
            tallyPrintGen++;
        } else advance();
    }

    function skipStep() {
        if (outcomeOn) {
            onNext();
            return;
        }
        if (filmplaying && filmEl.duration && isFinite(filmEl.duration)) {
            if (filmEl.paused) filmEl.play().catch(() => {});
            filmEl.currentTime = Math.max(0, filmEl.duration - 0.05);
            return;
        }
        if (choiceArmed) autoPick();
    }
    function advance() {
        hideOutcome();
        idx++;
        idx >= SCENES.length ? ending() : playScene(idx);
    }
    function hideOutcome() {
        outcomeOn = false;
        overrideOn = false;
    }

    function hideAgeCard() {
        clearTimeout(ageTimer);
        agecardOn = false;
    }

    function ending() {
        hideChoice();
        hideOutcome();
        hideAgeCard(); // no lingering "Age 45" card over the ending when the scene was skipped early
        filmEl.pause();
        playing = false;
        endReceiptLines = finalReceipt(ledger, debtTotal);
        endingOn = true;
        endPrintGen++;
    }
    function replay() {
        idx = 0;
        resetDebt();
        ledger = [];
        endingOn = false;
        endPrintGen = 0;
        playing = true;
        playScene(0);
    }
    function shareX() {
        const total = "£" + debtTotal.toLocaleString("en-GB");
        const site = location.origin + "/past-present-future/choices/mike";
        const rows = ledger
            .map((e) => `${e.to ? `${e.age}–${e.to}` : e.age} · ${e.label} ${moneyS(-(e.delta || 0))}`)
            .join("\n");
        const headline = debtTotal < 0 ? `By 45: £${(-debtTotal).toLocaleString("en-GB")} saved.` : `By 45: ${total} in debt.`;
        const text = `I did everything right. ${headline}\n\n${rows}\n\nEvery fact is sourced. Exit the loop 👇`;
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

        const probe = document.createElement("video");
        if (probe.canPlayType('video/webm; codecs="vp9"')) ext = ".webm";

        navBridge.onNav = (era) => {
            if (era === "past") goto("/past-present-future/museum-of-civil-liberties");
            else if (era === "present") goto("/past-present-future/choices");
            else if (era === "future") goto("/past-present-future/?to=future");
        };

        const done = () => (fontsIn = true);
        if (document.fonts?.ready) {
            document.fonts.ready.then(() => {
                if (alive) done();
            });
            later(done, 1500);
        } else done();

        ambientEl.src = vidSrc("ambient");
        startAmbient();

        later(
            () =>
                typeText(
                    (t) => (mhNote = t),
                    (t) => (mhTyping = t),
                    "Mike is fiction. The data is real.",
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
            cancelTimer();
            if (debtRAF) cancelAnimationFrame(debtRAF);
            timeouts.forEach(clearTimeout);
            preloaders.forEach((v) => {
                try {
                    v.removeAttribute("src");
                    v.load();
                    v.remove();
                } catch {}
            });
            try {
                filmEl.pause();
            } catch {}
        };
    });
</script>

<svelte:head>
    <title>LIFE · Mike · An Interactive Film</title>
    <meta
        name="description"
        content="You are Mike. Six choices. The clock is always running. Hesitate, and the system chooses for you."
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
                id="film"
                bind:this={filmEl}
                playsinline
                preload="auto"
                class:on={filmOn}
                class:frozen={filmFrozen}
                class:bfade={filmBfade}
                style:filter={gradeFilter}
                onplay={() => (paused = false)}
                onpause={() => (paused = true)}
                onvolumechange={() =>
                    (muted = filmEl.muted || filmEl.volume === 0)}
            ></video>
        </div>

        <div class="vignette" aria-hidden="true"></div>
        <div class="scan" aria-hidden="true"></div>
        <div class="grain grain-fx" aria-hidden="true"></div>
        <div id="flash" class:black={flashBlack} aria-hidden="true"></div>
        <div id="agecard" class:on={agecardOn} aria-hidden="true">
            {#key ageKey}<div class="ac-age">{acAge}</div>{/key}
        </div>

        <FilmHud
            showControls={filmplaying}
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
            onbegin={begin}
            onhover={(h) => (ambientReveal = h)}
        />

        <ChoiceScreen
            on={choiceOn}
            {urgent}
            age={cAge}
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
            view={outcomeView}
            good={oDebtGood}
            debtText={oDebtText}
            typing={oTyping}
            why={oWhy}
            src={oSrc}
            override={overrideOn}
            nextLabel={oNextLabel}
            {tallyLines}
            printGen={tallyPrintGen}
            onprintline={printLineSfx}
            onnext={onNext}
            bind:el={outcomeEl}
        />

        <EndingScreen
            on={endingOn}
            receiptLines={endReceiptLines}
            printGen={endPrintGen}
            onprintline={printLineSfx}
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
                > Sound required. Every scene is spoken.</span
            >
            <span class="mh-note" class:typing={mhTyping}>{mhNote}</span>
        </div>

        <Timeline
            scenes={SCENES}
            idx={tlIdx}
            prog={tlProg}
            debtTxt={debtShownTxt}
            {indebt}
            visible={playing && !choosing}
            bumpKey={tlBumpKey}
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
    @media (max-width: 640px) {
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
    #film.frozen {
        filter: blur(16px) brightness(0.5) saturate(0.85) !important;
    }
    #film.bfade {
        opacity: 0;
    }
    #ambient {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
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
        opacity: 0.11;
    }
    .vignette {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 39;
        background: radial-gradient(
            120% 95% at 50% 45%,
            transparent 38%,
            rgba(0, 0, 0, 0.55) 84%,
            rgba(0, 0, 0, 0.94) 100%
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
    #agecard {
        position: absolute;
        inset: 0;
        z-index: 46;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.55s ease;
    }
    #agecard.on {
        opacity: 1;
    }
    #agecard::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(
            120% 90% at 50% 50%,
            rgba(6, 8, 7, 0.5) 0%,
            rgba(6, 8, 7, 0.2) 45%,
            transparent 70%
        );
        opacity: 0.9;
    }
    #agecard .ac-age {
        position: relative;
        font-family: var(--display);
        font-weight: 400;
        font-size: clamp(56px, 12vw, 150px);
        line-height: 1;
        letter-spacing: -0.02em;
        color: var(--signal);
        margin-top: 14px;
        text-shadow: 0 6px 50px rgba(0, 0, 0, 0.8);
    }
    #agecard.on .ac-age {
        animation: riseIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) both 0.1s;
    }
    @keyframes riseIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
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
            transform: translateX(0);
        }
        100% {
            transform: translateX(333%);
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
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #fff;
        animation: hintrise 0.9s cubic-bezier(0.16, 1, 0.3, 1) both 0.35s;
    }
    @keyframes hintrise {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .muted-hint .mh-note {
        font-style: normal;
        font-family: var(--sans);
        font-size: 13px;
        letter-spacing: 0.01em;
        text-transform: none;
        color: #fff;
        min-height: 1.1em;
    }
    .muted-hint .mh-note.typing::after {
        content: "";
        display: inline-block;
        width: 0.52ch;
        height: 0.95em;
        margin-left: 2px;
        background: currentColor;
        transform: translateY(0.1em);
        animation: caret 0.5s steps(1) infinite;
    }
    @keyframes caret {
        50% {
            opacity: 0;
        }
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
    .root.playing .muted-hint {
        display: none;
    }
    .muted-hint.hidden {
        display: none;
    }

    @media (prefers-reduced-motion: reduce) {
        .muted-hint .hp {
            animation: none;
        }
        .muted-hint .mh-sound {
            animation: none;
        }
    }
    @media (max-width: 640px) {
        .muted-hint {
            white-space: normal;
            width: 88%;
        }
        .muted-hint .mh-sound {
            font-size: 10px;
            flex-direction: column;
            gap: 8px;
        }
    }
</style>
