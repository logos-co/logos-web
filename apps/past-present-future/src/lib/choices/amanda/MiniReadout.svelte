<script>
    import { METRICS, severity, bandOf } from "./film.js";

    let { show = false, raised = false } = $props();

    let rows = $state(
        METRICS.map((m) => ({
            key: m.key,
            label: m.label,
            v: "",
            w: null,
            band: "",
            d: "",
            dOn: false,
            dUp: false,
        })),
    );
    let profTxt = $state("94%");
    let barW = $state(null);
    let hot = $state(false);
    let bumpKey = $state(0);

    let profShown = 0,
        profRAF = null,
        deltaTimer = null;

    export function sync(M, hit) {
        METRICS.forEach((m, i) => {
            const r = rows[i];
            const v = M[m.key];
            r.v = v;
            r.band = bandOf(severity(m, v));
            r.w = v + "%";
            if (hit && hit[m.key]) {
                const n = hit[m.key],
                    worse = m.dir === "down" ? n < 0 : n > 0;
                r.d = (n > 0 ? "▲" : "▼") + Math.abs(n);
                r.dOn = true;
                r.dUp = !worse;
            } else if (!hit) {
                r.dOn = false;
                r.dUp = false;
            }
        });
        if (hit) {
            clearTimeout(deltaTimer);
            deltaTimer = setTimeout(
                () => rows.forEach((r) => (r.dOn = false)),
                3200,
            );
        }
    }

    export function animate(profile) {
        const start = profShown,
            end = profile,
            t0 = performance.now(),
            dur = 900;
        barW = 100 - profile + "%";
        if (profRAF) cancelAnimationFrame(profRAF);
        const step = (now) => {
            const k = Math.min(1, (now - t0) / dur);
            const v = Math.round(start + (end - start) * (1 - Math.pow(1 - k, 3)));
            profShown = v;
            profTxt = 100 - v + "%";
            if (k < 1) profRAF = requestAnimationFrame(step);
        };
        profRAF = requestAnimationFrame(step);
        hot = profile >= 55;
        bumpKey++;
    }

    export function reset() {
        profShown = 0;
        profTxt = "94%";
    }

    $effect(() => () => {
        if (profRAF) cancelAnimationFrame(profRAF);
        clearTimeout(deltaTimer);
    });
</script>

<div id="mini" class:show class:raised class:hot class:bump={bumpKey > 0}>
    <div class="mn-head">
        <span class="mn-hl"><i></i>Privacy</span>
        {#key bumpKey}<span class="mn-hv">{profTxt}</span>{/key}
    </div>
    <div class="mn-hbar"><i style:width={barW}></i></div>
    <div class="mn-rows">
        {#each rows as r (r.key)}
            <div class="mn-row">
                <span class="mn-l">{r.label}</span>
                <span class="mn-d" class:up={r.dUp} class:on={r.dOn}>{r.d}</span>
                <span class="mn-t"
                    ><i
                        class:warn={r.band === "warn"}
                        class:bad={r.band === "bad"}
                        style:width={r.w}
                    ></i></span
                >
                <span class="mn-v">{r.v}</span>
            </div>
        {/each}
    </div>
</div>

<style>
    #mini {
        position: absolute;
        right: 34px;
        bottom: 30px;
        z-index: 26;
        width: 258px;
        padding: 15px 16px 14px;
        border-radius: 18px;
        background: rgba(9, 12, 11, 0.62);
        border: 1px solid rgba(236, 236, 228, 0.12);
        -webkit-backdrop-filter: blur(18px) saturate(1.15);
        backdrop-filter: blur(18px) saturate(1.15);
        box-shadow:
            0 22px 55px -22px rgba(0, 0, 0, 0.9),
            0 1px 0 rgba(255, 255, 255, 0.05) inset;
        opacity: 0;
        transform: translateY(12px);
        transition:
            opacity 0.5s ease,
            transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
    }
    #mini.show {
        opacity: 1;
        transform: none;
    }
    #mini.raised {
        z-index: 30;
    }
    .mn-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
    }
    .mn-hl {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: var(--code);
        font-size: 9px;
        letter-spacing: 0.26em;
        text-transform: uppercase;
        color: rgba(236, 236, 228, 0.45);
    }
    .mn-hl i {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--bad);
        animation: mnLive 1.8s ease-in-out infinite;
    }
    @keyframes mnLive {
        0%,
        100% {
            opacity: 0.35;
        }
        50% {
            opacity: 1;
        }
    }
    .mn-hv {
        font-family: var(--sans);
        font-size: 19px;
        font-weight: 600;
        letter-spacing: -0.02em;
        color: #fff;
        font-variant-numeric: tabular-nums;
        transform-origin: right bottom;
    }
    #mini.hot .mn-hv {
        color: var(--bad);
    }
    #mini.bump .mn-hv {
        animation: profBump 0.7s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes profBump {
        0% {
            transform: scale(1);
        }
        24% {
            transform: scale(1.24);
        }
        100% {
            transform: scale(1);
        }
    }
    .mn-hbar {
        position: relative;
        height: 2px;
        margin-top: 9px;
        border-radius: 99px;
        background: rgba(236, 236, 228, 0.12);
        overflow: hidden;
    }
    .mn-hbar i {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        border-radius: 99px;
        background: var(--paper);
        transition:
            width 0.9s cubic-bezier(0.16, 1, 0.3, 1),
            background 0.6s ease;
    }
    #mini.hot .mn-hbar i {
        background: var(--bad);
    }
    .mn-rows {
        margin-top: 13px;
        padding-top: 12px;
        border-top: 1px solid rgba(236, 236, 228, 0.09);
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .mn-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .mn-l {
        flex: 1;
        font-family: var(--code);
        font-size: 8.5px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: rgba(236, 236, 228, 0.58);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .mn-d {
        flex: none;
        width: 30px;
        text-align: right;
        font-family: var(--code);
        font-size: 8.5px;
        letter-spacing: 0.02em;
        color: var(--bad);
        opacity: 0;
        transition: opacity 0.35s ease;
    }
    .mn-d.up {
        color: var(--good);
    }
    .mn-d.on {
        opacity: 1;
    }
    .mn-t {
        position: relative;
        flex: none;
        width: 56px;
        height: 3px;
        border-radius: 99px;
        background: rgba(236, 236, 228, 0.1);
    }
    .mn-t i {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        border-radius: 99px;
        background: var(--ok);
        transition:
            width 0.85s cubic-bezier(0.16, 1, 0.3, 1),
            background 0.6s ease;
    }
    .mn-t i.warn {
        background: var(--warn);
    }
    .mn-t i.bad {
        background: var(--bad);
    }
    .mn-v {
        flex: none;
        width: 19px;
        text-align: right;
        font-family: var(--sans);
        font-size: 11.5px;
        font-weight: 600;
        color: rgba(236, 236, 228, 0.92);
        font-variant-numeric: tabular-nums;
    }
    @media (max-width: 680px), (max-aspect-ratio: 5/7) {
        .mn-l {
            flex: none;
        }
        .mn-t {
            flex: 1;
            width: auto;
            min-width: 24px;
        }
    }
    @media (max-width: 680px) {
        #mini {
            right: 16px;
            bottom: 18px;
            width: 232px;
            padding: 12px 12px 11px;
            border-radius: 15px;
        }
        .mn-hv {
            font-size: 16px;
        }
        .mn-t {
            width: 40px;
        }
        .mn-rows {
            gap: 6.5px;
        }
    }
    @media (max-aspect-ratio: 5/7) {
        #mini {
            left: 0;
            right: 0;
            width: auto;
            top: calc(100% - var(--panel-h));
            bottom: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 12px 24px 16px;
            border: 0;
            border-radius: 0;
            box-shadow: none;
            transform: none;
        }
        #mini.show {
            transform: none;
        }
        .mn-l {
            font-size: 9px;
            letter-spacing: 0.12em;
        }
        .mn-t {
            width: auto;
            flex: 1;
            max-width: none;
            margin: 0 10px;
        }
        .mn-rows {
            gap: 7px;
        }
    }
    @media (max-aspect-ratio: 5/7) and (max-height: 700px) {
        #mini {
            padding: 8px 22px 12px;
        }
        .mn-hv {
            font-size: 15px;
        }
        .mn-rows {
            margin-top: 9px;
            padding-top: 9px;
            gap: 4.5px;
        }
    }
</style>
