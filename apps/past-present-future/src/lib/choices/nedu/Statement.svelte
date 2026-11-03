<script>
    import { LOGO_SVG } from "./logo.js";
    import { naira, costText } from "./ledger.js";
    import { sfxLine, sfxStamp } from "./sfx.js";

    /* Mike gets a thermal receipt. Amanda gets a profile.
       Nedu gets a statement that balances perfectly. */
    let {
        id = undefined,
        mode = "running",
        age = 23,
        now = 0,
        data,
        stamp = "",
        stampSub = "",
        dense = false,
        el = $bindable(),
    } = $props();

    const running = $derived(mode === "running");
    let stampIn = $state(false);
    const timers = [];

    /* the statement prints a line at a time, the way Mike's receipt does,
       then the stamp comes down on top of it */
    export function print() {
        timers.forEach(clearTimeout);
        timers.length = 0;
        stampIn = false;
        if (!el) return;
        const lines = [...el.children];
        const per = 105;
        lines.forEach((r) => {
            r.style.transition = "none";
            r.style.opacity = "";
            r.style.transform = "";
        });
        void el.offsetWidth;
        lines.forEach((r, i) => {
            r.style.transition = "opacity .12s ease, transform .12s ease";
            timers.push(
                setTimeout(() => {
                    r.style.opacity = "1";
                    r.style.transform = "none";
                    sfxLine(i);
                }, i * per),
            );
        });
        const done = lines.length * per;
        if (!running)
            timers.push(
                setTimeout(() => {
                    stampIn = true;
                    sfxStamp();
                }, done + 380),
            );
    }

    $effect(() => () => timers.forEach(clearTimeout));
</script>

<div class="pnl" class:dense {id} bind:this={el}>
    <div class="p-brand">{@html LOGO_SVG}</div>
    <div class="p-title">Life’s Choices</div>
    <div class="p-meta">
        Clean Canal Initiative<br />{running
            ? "The tab so far · Age " + age
            : "Nedu · Age 23 to 41"}
    </div>
    <div class="p-rule"></div>
    <div class="p-band">
        <div class="bcell">
            <div class="bl">Gone, no record</div>
            <div class="bv miss">{naira(data.unaccounted)}</div>
            <div class="bs">
                {data.moneyIn > 0
                    ? data.leakPct + "% of everything he was given"
                    : ""}
            </div>
        </div>
        <div class="bcell">
            <div class="bl">Canal cleared</div>
            <div class="bv">{data.cleared}%</div>
            <div class="bs">{data.tonnes.toLocaleString("en-GB")} tonnes out</div>
        </div>
    </div>
    <div class="p-rule"></div>
    <div class="p-sect">{running ? "The story so far" : "What he did"}</div>
    <div class="p-story">
        {#each data.entries as e (e.n)}
            <div class="st-row" class:now={running && e.n === now}>
                <span class="st-age">{e.age}</span>
                <span class="st-txt"
                    >{e.did}
                    {#if !e.inAmt}Nothing came in.{:else if !e.outAmt}<b
                            >{naira(e.inAmt)}</b
                        > came in, all of it reached the canal.{:else if e.filed}<b
                            >{naira(e.inAmt)}</b
                        > came in. <b>{naira(e.outAmt)}</b> went on {costText(
                            e,
                        )}. He reported it.{:else}<b>{naira(e.inAmt)}</b> came
                        in. <b class="miss">{naira(e.outAmt)}</b> went on {costText(
                            e,
                        )}. No record.{/if}</span
                >
            </div>
        {/each}
    </div>
    {#if !running}
        <div class="p-rule hair"></div>
        <div class="p-note">Balance ₦0. On paper, nothing is missing.</div>
        <div class="p-op">
            <div class="stamp" class:in={stampIn}>
                <div class="s1">{stamp}</div>
                <div class="s2">{stampSub}</div>
            </div>
        </div>
    {/if}
</div>

<style>
    .pnl {
        --doc: #e8e5d9;
        --doc2: #dedacb;
        --doci: #141f1b;
        --docm: rgba(20, 31, 27, 0.58);
        --stamp: #b22b1a;
        position: relative;
        flex: none;
        width: min(560px, 100%);
        margin: 12px auto 0;
        text-align: left;
        background: linear-gradient(178deg, var(--doc) 0%, var(--doc2) 100%);
        color: var(--doci);
        padding: 34px 34px 30px;
        border-radius: 3px;
        overflow: hidden;
        box-shadow:
            0 40px 90px -30px rgba(0, 0, 0, 0.95),
            0 2px 0 rgba(255, 255, 255, 0.5) inset;
    }
    .pnl::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.5;
        mix-blend-mode: multiply;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/></filter><rect width='100%25' height='100%25' filter='url(%23p)' opacity='0.35'/></svg>");
    }
    /* every line prints in, one at a time */
    .pnl > * {
        position: relative;
        z-index: 2;
        opacity: 0;
        transform: translateY(-4px);
    }

    .p-brand {
        text-align: center;
    }
    .p-brand :global(svg) {
        height: 26px;
        width: auto;
        color: var(--doci);
        opacity: 0.8;
        display: inline-block;
    }
    .p-title {
        margin-top: 12px;
        text-align: center;
        font-family: var(--display);
        font-weight: 400;
        font-size: 26px;
        letter-spacing: -0.01em;
        line-height: 1;
    }
    .p-meta {
        margin-top: 9px;
        text-align: center;
        font-family: var(--code);
        font-size: 10px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--docm);
        line-height: 1.8;
    }
    .p-rule {
        height: 1px;
        background: var(--doci);
        opacity: 0.75;
        margin: 18px 0;
    }
    .p-rule.hair {
        margin: 14px 0;
    }

    .p-band {
        display: flex;
        gap: 22px;
        align-items: flex-start;
    }
    .p-band .bcell {
        flex: 1;
        min-width: 0;
    }
    .p-band .bl {
        font-family: var(--code);
        font-size: 9px;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: var(--docm);
    }
    .p-band .bv {
        margin-top: 6px;
        font-family: var(--sans);
        font-size: clamp(21px, 3.4vw, 29px);
        font-weight: 600;
        letter-spacing: -0.03em;
        line-height: 1;
        font-variant-numeric: tabular-nums;
    }
    .p-band .bv.miss {
        color: var(--stamp);
    }
    .p-band .bs {
        margin-top: 6px;
        font-family: var(--code);
        font-size: 9.5px;
        letter-spacing: 0.04em;
        color: var(--docm);
    }

    .p-sect {
        font-family: var(--code);
        font-size: 9.5px;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: var(--docm);
    }
    .p-story {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .st-row {
        display: flex;
        gap: 12px;
        align-items: baseline;
        padding: 7px 0;
        border-top: 1px solid rgba(20, 31, 27, 0.1);
    }
    .st-row:first-child {
        border-top: 0;
    }
    .st-age {
        flex: none;
        width: 30px;
        font-family: var(--code);
        font-size: 9.5px;
        letter-spacing: 0.1em;
        color: rgba(20, 31, 27, 0.42);
    }
    .st-txt {
        flex: 1;
        font-family: var(--sans);
        font-size: 13px;
        line-height: 1.5;
        color: var(--doci);
    }
    .st-txt b {
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }
    .st-txt b.miss {
        color: var(--stamp);
    }
    .st-row.now {
        background: rgba(178, 43, 26, 0.08);
        box-shadow:
            -12px 0 0 rgba(178, 43, 26, 0.08),
            12px 0 0 rgba(178, 43, 26, 0.08);
    }
    .st-row.now .st-txt {
        font-weight: 500;
    }
    .p-note {
        margin-top: 8px;
        font-family: var(--sans);
        font-size: 12px;
        line-height: 1.5;
        color: var(--docm);
    }

    .p-op {
        display: flex;
        justify-content: flex-end;
        padding: 14px 4px 4px 0;
    }
    .stamp {
        position: relative;
        width: 130px;
        padding: 9px 6px 8px;
        text-align: center;
        border: 2.5px solid var(--stamp);
        border-radius: 5px;
        color: var(--stamp);
        transform: rotate(-9deg) scale(0.6);
        opacity: 0;
        transform-origin: center;
        font-family: var(--code);
        letter-spacing: 0.14em;
        text-transform: uppercase;
        line-height: 1.25;
        mix-blend-mode: multiply;
    }
    .stamp .s1 {
        font-size: 12px;
        font-weight: 500;
    }
    .stamp .s2 {
        margin-top: 4px;
        font-size: 7.5px;
        letter-spacing: 0.18em;
        opacity: 0.85;
    }
    .stamp.in {
        animation: stampDown 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes stampDown {
        0% {
            opacity: 0;
            transform: rotate(-9deg) scale(1.5);
        }
        60% {
            opacity: 0.95;
            transform: rotate(-9deg) scale(0.96);
        }
        100% {
            opacity: 0.88;
            transform: rotate(-9deg) scale(1);
        }
    }

    /* beside the verdict the sheet is denser, so it sits in view */
    .pnl.dense {
        margin: 0;
        width: 100%;
        padding: 22px 24px 20px;
    }
    .dense .p-brand :global(svg) {
        height: 20px;
    }
    .dense .p-title {
        font-size: 20px;
        margin-top: 8px;
    }
    .dense .p-meta {
        margin-top: 6px;
        font-size: 9px;
        line-height: 1.6;
    }
    .dense .p-rule {
        margin: 12px 0;
    }
    .dense .p-rule.hair {
        margin: 10px 0;
    }
    .dense .p-band .bv {
        font-size: 22px;
    }
    .dense .p-band .bs {
        margin-top: 4px;
    }
    .dense .st-row {
        padding: 5px 0;
    }
    .dense .st-txt {
        font-size: 11.5px;
    }
    .dense .p-note {
        font-size: 11px;
        margin-top: 5px;
    }
    .dense .p-op {
        padding-top: 10px;
    }
    .dense .stamp {
        width: 116px;
        padding: 7px 5px 6px;
    }
    .dense .stamp .s1 {
        font-size: 11px;
    }
    @media (max-width: 900px) {
        .pnl.dense {
            margin: 0 auto;
            width: min(560px, 100%);
        }
        .dense .p-op {
            padding-right: 0;
        }
    }

    @media (max-width: 560px) {
        .pnl:not(.dense) {
            padding: 24px 20px 22px;
        }
        .p-band {
            flex-direction: column;
            gap: 16px;
        }
        .p-op {
            justify-content: center;
        }
        .stamp {
            margin: 6px auto 0;
            transform: rotate(-4deg) scale(0.6);
        }
        .stamp.in {
            animation-name: stampDownM;
        }
        @keyframes stampDownM {
            0% {
                opacity: 0;
                transform: rotate(-4deg) scale(1.5);
            }
            60% {
                opacity: 0.95;
                transform: rotate(-4deg) scale(0.96);
            }
            100% {
                opacity: 0.88;
                transform: rotate(-4deg) scale(1);
            }
        }
    }
</style>
