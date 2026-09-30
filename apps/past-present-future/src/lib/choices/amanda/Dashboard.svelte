<script>
    import { LOGO_SVG } from "./logo.js";
    import { METRICS, SRC_URLS, severity, bandOf } from "./film.js";
    import { sfxSweep, sfxRoll, sfxData, sfxAlert } from "./sfx.js";

    let {
        id = undefined,
        wide = false,
        title,
        sub,
        heroLine,
        footL,
        footR,
        sources = [],
        from,
        to,
    } = $props();

    const RING_C = 326.7;

    let el = $state();
    let srcOpen = $state(false);

    const rows = $derived(
        METRICS.map((m) => {
            const f = from[m.key],
                t = to[m.key],
                d = t - f;
            const worse = m.dir === "down" ? d < 0 : d > 0;
            return {
                label: m.label,
                from: f,
                to: t,
                band: bandOf(severity(m, t)),
                d,
                up: !worse,
            };
        }),
    );

    const timers = new Set();
    function later(fn, ms) {
        const t = setTimeout(() => {
            timers.delete(t);
            fn();
        }, ms);
        timers.add(t);
    }
    $effect(() => () => timers.forEach(clearTimeout));

    function countUp(node, a, b, dur) {
        const t0 = performance.now();
        const step = (now) => {
            const k = Math.min(1, (now - t0) / dur);
            const v = Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3)));
            node.textContent = v.toLocaleString("en-GB");
            if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    export function play(heroFrom, heroTo, dpFrom, dpTo) {
        if (!el) return;
        const ring = el.querySelector(".rv"),
            num = el.querySelector(".rn"),
            dpn = el.querySelector(".dpn");
        const sevBand =
            heroTo >= 72
                ? "var(--bad)"
                : heroTo >= 45
                  ? "var(--warn)"
                  : "var(--ok)";
        ring.style.transition = "none";
        ring.style.strokeDashoffset = RING_C * (1 - heroFrom / 100);
        void ring.offsetWidth;
        ring.style.stroke = sevBand;
        ring.style.transition =
            "stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1), stroke .6s ease";
        later(() => {
            ring.style.strokeDashoffset = RING_C * (1 - heroTo / 100);
        }, 40);
        countUp(num, heroFrom, heroTo, 1100);
        countUp(dpn, dpFrom, dpTo, 1300);
        sfxSweep(1.15);
        sfxRoll(1.3, 12);
        const rowEls = [...el.querySelectorAll(".mrow")];
        rowEls.forEach((r, i) => {
            const fill = r.querySelector(".mfill"),
                ghost = r.querySelector(".mghost"),
                val = r.querySelector(".mval");
            const f = rows[i].from,
                t = rows[i].to;
            fill.style.transition = "none";
            fill.style.width = f + "%";
            ghost.style.transition = "none";
            ghost.style.left = f + "%";
            val.textContent = f;
            later(
                () => {
                    r.classList.add("in");
                    ghost.classList.add("on");
                    void fill.offsetWidth;
                    fill.style.transition =
                        "width .95s cubic-bezier(.16,1,.3,1), background .6s ease";
                    fill.style.width = t + "%";
                    countUp(val, f, t, 900);
                    sfxData(i);
                },
                380 + i * 130,
            );
        });
        const worst = rows.filter((r) => r.band === "bad").length;
        if (worst) later(() => sfxAlert(), 380 + rowEls.length * 130 + 260);
    }
</script>

<div class="dash" class:wide {id} bind:this={el}>
    <div class="dh">
        <div class="dh-l">
            <div class="dh-title">{title}</div>
            <div class="dh-sub">{sub}</div>
        </div>
        <div class="dh-r">{@html LOGO_SVG}</div>
    </div>
    <div class="d-rule"></div>
    <div class="d-hero">
        <div class="ring">
            <svg viewBox="0 0 120 120"
                ><circle class="rt" cx="60" cy="60" r="52"></circle><circle
                    class="rv"
                    cx="60"
                    cy="60"
                    r="52"
                ></circle></svg
            >
            <div class="rnum"><span class="rn">0</span><sub>%</sub></div>
        </div>
        <div class="d-hero-txt">
            <div class="hl">Profile complete</div>
            <div class="hv">{heroLine}</div>
            <div class="hd"><b class="dpn">0</b> data points on file</div>
        </div>
    </div>
    <div class="d-rule mid"></div>
    <div class="d-rows">
        {#each rows as r}
            <div class="mrow">
                <div class="mtop">
                    <span class="mlabel">{r.label}</span><span class="mval"
                        >{r.to}</span
                    >{#if r.d === 0}<span class="mdelta flat">—</span
                        >{:else}<span class="mdelta" class:up={r.up}
                            >{r.d > 0 ? "▲" : "▼"} {Math.abs(r.d)}</span
                        >{/if}
                </div>
                <div class="mtrack">
                    <i
                        class="mfill"
                        class:warn={r.band === "warn"}
                        class:bad={r.band === "bad"}
                    ></i><span class="mghost"></span>
                </div>
            </div>
        {/each}
    </div>
    <div class="d-foot"><span>{footL}</span><span>{footR}</span></div>
    {#if sources.length}
        <div class="d-sources">
            <button
                class="ds-head"
                type="button"
                aria-expanded={srcOpen}
                onclick={() => (srcOpen = !srcOpen)}
                >Sources <svg
                    class="ds-arw"
                    class:open={srcOpen}
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg
                ></button
            >
            {#if srcOpen}{#each sources as s}
                <span class="ds-item"
                    >{#if SRC_URLS[s]}<a
                            href={SRC_URLS[s]}
                            target="_blank"
                            rel="noopener">{s}</a
                        >{:else}{s}{/if}</span
                >
            {/each}{/if}
        </div>
    {/if}
</div>

<style>
    .dash {
        width: min(430px, 100%);
        margin: 12px auto 0;
        text-align: left;
        background: linear-gradient(180deg, #121716 0%, #0c100f 100%);
        border: 1px solid rgba(236, 236, 228, 0.11);
        border-radius: 26px;
        padding: 24px 24px 22px;
        box-shadow:
            0 30px 70px -24px rgba(0, 0, 0, 0.9),
            0 1px 0 rgba(255, 255, 255, 0.05) inset;
    }
    .dash.wide {
        width: min(520px, 100%);
    }
    .dh {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
    }
    .dh-title {
        font-family: var(--sans);
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.01em;
        color: var(--signal);
    }
    .dh-sub {
        margin-top: 5px;
        font-family: var(--code);
        font-size: 10px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: rgba(236, 236, 228, 0.38);
    }
    .dh-r :global(svg) {
        height: 22px;
        width: auto;
        color: rgba(236, 236, 228, 0.55);
    }
    .d-rule {
        height: 1px;
        background: rgba(236, 236, 228, 0.09);
        margin: 20px 0;
    }

    .d-hero {
        display: flex;
        align-items: center;
        gap: 22px;
    }
    .ring {
        position: relative;
        flex: none;
        width: 112px;
        height: 112px;
    }
    .ring svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
        display: block;
    }
    .ring .rt {
        fill: none;
        stroke: rgba(236, 236, 228, 0.1);
        stroke-width: 7;
    }
    .ring .rv {
        fill: none;
        stroke: var(--bad);
        stroke-width: 7;
        stroke-linecap: round;
        stroke-dasharray: 326.7;
        stroke-dashoffset: 326.7;
        transition:
            stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1),
            stroke 0.6s ease;
    }
    .ring .rnum {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--sans);
        font-size: 26px;
        font-weight: 600;
        letter-spacing: -0.02em;
        color: var(--signal);
        font-variant-numeric: tabular-nums;
    }
    .ring .rnum sub {
        font-size: 12px;
        font-weight: 500;
        vertical-align: baseline;
        margin-left: 1px;
        color: rgba(236, 236, 228, 0.5);
    }
    .d-hero-txt .hl {
        font-family: var(--code);
        font-size: 10px;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: rgba(236, 236, 228, 0.4);
    }
    .d-hero-txt .hv {
        margin-top: 8px;
        font-family: var(--sans);
        font-size: 15px;
        line-height: 1.45;
        color: var(--signal);
    }
    .d-hero-txt .hd {
        margin-top: 10px;
        font-family: var(--code);
        font-size: 11px;
        letter-spacing: 0.02em;
        color: rgba(236, 236, 228, 0.44);
    }
    .d-hero-txt .hd b {
        color: var(--bad);
        font-weight: 500;
    }

    .d-rows {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }
    .mrow {
        opacity: 0;
        transform: translateY(6px);
        transition:
            opacity 0.35s ease,
            transform 0.35s ease;
    }
    .mrow:global(.in) {
        opacity: 1;
        transform: none;
    }
    .mtop {
        display: flex;
        align-items: baseline;
        gap: 10px;
    }
    .mlabel {
        flex: 1;
        font-family: var(--code);
        font-size: 10.5px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: rgba(236, 236, 228, 0.62);
    }
    .mval {
        font-family: var(--sans);
        font-size: 15px;
        font-weight: 600;
        color: var(--signal);
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.01em;
    }
    .mdelta {
        font-family: var(--code);
        font-size: 10.5px;
        letter-spacing: 0.04em;
        padding: 2px 6px;
        border-radius: 5px;
        background: rgba(239, 75, 60, 0.13);
        color: var(--bad);
        white-space: nowrap;
        min-width: 44px;
        text-align: center;
    }
    .mdelta.up {
        background: rgba(143, 214, 148, 0.13);
        color: var(--good);
    }
    .mdelta.flat {
        background: rgba(236, 236, 228, 0.07);
        color: rgba(236, 236, 228, 0.4);
    }
    .mtrack {
        position: relative;
        height: 4px;
        margin-top: 9px;
        border-radius: 99px;
        background: rgba(236, 236, 228, 0.09);
        overflow: visible;
    }
    .mfill {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        border-radius: 99px;
        width: 0%;
        background: var(--ok);
        transition:
            width 0.95s cubic-bezier(0.16, 1, 0.3, 1),
            background 0.6s ease;
    }
    .mfill.warn {
        background: var(--warn);
    }
    .mfill.bad {
        background: var(--bad);
    }
    .mghost {
        position: absolute;
        top: -3px;
        width: 1px;
        height: 10px;
        background: rgba(236, 236, 228, 0.5);
        left: 0%;
        transition: left 0.95s cubic-bezier(0.16, 1, 0.3, 1);
        opacity: 0;
    }
    .mghost:global(.on) {
        opacity: 0.55;
    }

    .d-foot {
        margin-top: 19px;
        padding-top: 15px;
        border-top: 1px solid rgba(236, 236, 228, 0.09);
        font-family: var(--code);
        font-size: 10px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(236, 236, 228, 0.3);
        display: flex;
        justify-content: space-between;
        gap: 10px;
    }
    .d-sources {
        margin-top: 16px;
        padding-top: 14px;
        border-top: 1px solid rgba(236, 236, 228, 0.09);
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .ds-head {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        align-self: flex-start;
        padding: 0;
        background: none;
        border: 0;
        cursor: pointer;
        font-family: var(--code);
        font-size: 9.5px;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: rgba(236, 236, 228, 0.45);
        margin-bottom: 3px;
        transition: color 0.2s;
    }
    .ds-head:hover {
        color: var(--signal);
    }
    .ds-arw {
        display: block;
        flex: none;
        transition: transform 0.25s ease;
    }
    .ds-arw.open {
        transform: rotate(90deg);
    }
    .ds-item {
        font-family: var(--code);
        font-size: 11px;
        line-height: 1.6;
        color: rgba(236, 236, 228, 0.6);
    }
    .ds-item a {
        color: inherit;
        text-decoration: underline;
        text-underline-offset: 2px;
    }
    @media (min-width: 761px) {
        .dash.wide {
            width: min(760px, 100%);
            display: grid;
            grid-template-columns: minmax(0, 290px) minmax(0, 1fr);
            grid-template-areas:
                "dh rows"
                "hero rows"
                "rule rule"
                "foot src";
            column-gap: 40px;
            padding: 22px 26px 20px;
        }
        .dash.wide > .dh {
            grid-area: dh;
            margin-bottom: 16px;
        }
        .dash.wide > .d-rule {
            display: none;
        }
        .dash.wide > .d-rule.mid {
            display: block;
            grid-area: rule;
            margin: 18px 0 14px;
        }
        .dash.wide > .d-hero {
            grid-area: hero;
            gap: 18px;
        }
        .dash.wide .ring {
            width: 96px;
            height: 96px;
        }
        .dash.wide .ring .rnum {
            font-size: 23px;
        }
        .dash.wide .d-hero-txt .hv {
            font-size: 14px;
        }
        .dash.wide > .d-rows {
            grid-area: rows;
            align-self: center;
            gap: 7px;
        }
        .dash.wide .mtrack {
            margin-top: 7px;
        }
        .dash.wide > .d-foot {
            grid-area: foot;
            margin: 0;
            padding: 0;
            border: 0;
            align-self: start;
        }
        .dash.wide > .d-sources {
            grid-area: src;
            margin: 0;
            padding: 0;
            border: 0;
        }
    }
    @media (max-width: 520px) {
        .dash {
            padding: 20px 18px 18px;
            border-radius: 22px;
        }
        .d-hero {
            gap: 16px;
        }
        .ring {
            width: 92px;
            height: 92px;
        }
        .ring .rnum {
            font-size: 22px;
        }
        .d-hero-txt .hv {
            font-size: 13.5px;
        }
    }
</style>
