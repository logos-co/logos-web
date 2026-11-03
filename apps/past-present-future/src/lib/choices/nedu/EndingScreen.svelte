<script>
    import { tick } from "svelte";
    import { base } from "$app/paths";
    import Statement from "./Statement.svelte";
    import { ENDING, CIRCLE, srcOf } from "./film.js";

    let {
        on = false,
        data = null,
        stamp = "",
        stampSub = "",
        sources = [],
        onreplay,
        onshare,
    } = $props();

    let page = $state(1);
    let screenEl, srcEl;
    let sheet = $state(null),
        sheetEl = $state(null);
    const fact = srcOf(ENDING.src);

    /* the sheet sits beside the verdict and must land fully in view on a laptop.
       it is zoomed down to fit the height the page has; on phones it stacks and scrolls. */
    function fitSheet() {
        if (!sheetEl || !screenEl) return;
        sheetEl.style.zoom = "";
        if (window.innerWidth <= 900 || page !== 1) return;
        const cs = getComputedStyle(screenEl);
        const avail =
            screenEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 8;
        const need = sheetEl.offsetHeight + (srcEl?.offsetHeight || 0) + 14;
        const z = Math.min(1, avail / need);
        if (z < 0.999) sheetEl.style.zoom = z.toFixed(3);
    }

    export async function start() {
        page = 1;
        await tick();
        if (screenEl) screenEl.scrollTop = 0;
        fitSheet();
        setTimeout(() => sheet?.print(), 300);
    }
    function toPage(p) {
        page = p;
        if (screenEl) screenEl.scrollTop = 0;
    }
</script>

<svelte:window onresize={() => on && fitSheet()} />

<section class="screen" id="ending" class:on bind:this={screenEl}>
    <!-- page 1 · the verdict and the statement, side by side -->
    <div class="ep" class:on={page === 1}>
        <div class="e-grid">
            <div class="e-left">
                <div class="kick">{ENDING.kick}</div>
                <h1>{ENDING.title}</h1>
                <div class="end-fact">
                    <div>{ENDING.fact}</div>
                    <div class="fs">
                        Source · <a href={fact.url} target="_blank" rel="noopener"
                            >{fact.name}</a
                        >
                    </div>
                </div>
                <div class="e-next">
                    <button class="btn primary" onclick={() => toPage(2)}
                        >{ENDING.next}</button
                    >
                </div>
            </div>
            <div class="e-right">
                <!-- a fresh sheet for every ending, so "Live it again" never flashes the last one -->
                {#key data}
                    {#if data}
                        <Statement
                            bind:this={sheet}
                            bind:el={sheetEl}
                            id="endPnl"
                            mode="final"
                            dense
                            {data}
                            {stamp}
                            {stampSub}
                        />
                    {/if}
                {/key}
                <div class="e-src" bind:this={srcEl}>
                    {#if sources.length}Sources ·
                        {#each sources as s, i}{#if i}{" · "}{/if}{#if s.url}<a
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener">{s.name}</a
                                >{:else}{s.name}{/if}{/each}{/if}
                </div>
                <div class="e-next m">
                    <button class="btn primary" onclick={() => toPage(2)}
                        >{ENDING.next}</button
                    >
                </div>
            </div>
        </div>
    </div>

    <!-- page 2 · the Circle -->
    <div class="ep ep2" class:on={page === 2}>
        <div class="circ">
            <div class="ci-t">{CIRCLE.title}</div>
            <div class="ci-p">{CIRCLE.lead} <b>{CIRCLE.strong}</b></div>
        </div>
        <div class="end-out">
            <a
                class="btn primary eo-cta"
                href={CIRCLE.href}
                target="_blank"
                rel="noopener">{CIRCLE.cta}</a
            >
        </div>
        <div class="e-actions">
            <button class="btn" onclick={onreplay}>Live it again</button>
            <a class="btn" href="{base}/choices">Live as someone else</a>
            <button class="btn" onclick={onshare}>Share the audit on X</button>
            <button class="btn" onclick={() => toPage(1)}
                >◄ Back to the statement</button
            >
        </div>
    </div>
</section>

<style>
    .screen {
        position: absolute;
        inset: 0;
        display: none;
        flex-direction: column;
        align-items: center;
        z-index: 30;
        text-align: center;
        justify-content: flex-start;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        /* clear the nav mark */
        padding: max(5vh, 72px) 6vw 5vh;
    }
    .screen.on {
        display: flex;
    }
    .screen::before {
        content: "";
        position: fixed;
        inset: 0;
        background: rgba(6, 8, 7, 0.62);
        z-index: -1;
    }
    .screen > * {
        flex: none;
    }
    @media (max-width: 680px) {
        .screen {
            padding: 78px 6vw calc(5vh + env(safe-area-inset-bottom, 0px));
        }
        /* the sheet scrolls under the nav: fade it out before it gets there */
        .screen::after {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 92px;
            background: linear-gradient(to bottom, rgba(6, 8, 7, 0.94) 45%, rgba(6, 8, 7, 0));
            pointer-events: none;
            z-index: 4;
        }
    }

    .ep {
        display: none;
        width: 100%;
    }
    .ep.on {
        display: block;
    }
    .ep2.on {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: auto 0;
    }
    .e-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 500px);
        gap: 5vw;
        align-items: center;
        width: 100%;
        max-width: 1180px;
        margin: 0 auto;
        min-height: 100%;
    }
    .e-left {
        text-align: left;
    }
    .e-next {
        margin-top: 30px;
    }
    .e-next .btn {
        margin-top: 0;
    }
    .e-next.m {
        display: none;
        text-align: center;
    }

    .kick {
        font-size: 12px;
        letter-spacing: 0.36em;
        color: rgba(236, 236, 228, 0.7);
        text-transform: uppercase;
        margin-bottom: 26px;
    }
    h1 {
        font-family: var(--display);
        font-weight: 400;
        font-size: clamp(36px, 5vw, 76px);
        line-height: 0.9;
        letter-spacing: -0.03em;
        text-transform: none;
        color: var(--paper);
    }
    .end-fact {
        margin-top: 26px;
        max-width: min(48ch, 100%);
        font-family: var(--sans);
        font-size: clamp(13px, 1.15vw, 15px);
        line-height: 1.65;
        color: rgba(236, 236, 228, 0.82);
    }
    .end-fact .fs {
        margin-top: 14px;
        font-family: var(--code);
        font-size: 11px;
        color: rgba(236, 236, 228, 0.45);
    }
    .end-fact .fs a,
    .e-src a {
        color: inherit;
        text-decoration: underline;
        text-underline-offset: 2px;
    }
    .end-fact .fs a:hover,
    .e-src a:hover {
        color: var(--signal);
    }
    .e-right :global(#endPnl) {
        margin-top: 30px;
    }
    .e-src {
        margin-top: 14px;
        max-width: 100%;
        font-family: var(--code);
        font-size: 11px;
        line-height: 1.7;
        color: rgba(236, 236, 228, 0.45);
    }

    @media (max-width: 900px) {
        .e-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 34px;
            align-items: start;
            max-width: 100%;
        }
        .e-left,
        .e-right {
            min-width: 0;
            max-width: 100%;
        }
        .e-left {
            text-align: center;
        }
        .end-fact {
            margin: 26px auto 0;
            text-align: center;
        }
        .e-left .e-next {
            display: none;
        }
        .e-next.m {
            display: block;
            margin-top: 26px;
        }
        .e-src {
            width: min(560px, 100%);
            margin-inline: auto;
        }
    }

    /* the Circle */
    .circ {
        width: min(640px, 100%);
        margin: 24px auto 0;
        text-align: left;
        padding: 28px 28px 26px;
        border: 1px solid rgba(236, 236, 228, 0.2);
        border-radius: 20px;
        background: rgba(236, 236, 228, 0.04);
    }
    .ci-t {
        margin-top: 12px;
        font-family: var(--display);
        font-weight: 400;
        font-size: clamp(28px, 4vw, 48px);
        line-height: 1;
        letter-spacing: -0.015em;
        color: var(--signal);
    }
    .ci-p {
        margin-top: 16px;
        font-family: var(--sans);
        font-size: clamp(14px, 1.3vw, 16px);
        line-height: 1.6;
        color: rgba(236, 236, 228, 0.85);
    }
    .ci-p b {
        font-weight: 500;
        color: var(--signal);
    }
    @media (max-width: 680px) {
        .circ {
            padding: 22px 18px 20px;
        }
    }
    .end-out {
        margin-top: 34px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .end-out .eo-cta {
        margin-top: 0;
        padding: 17px 32px;
        font-size: 12px;
        letter-spacing: 0.16em;
    }
    .e-actions {
        margin-top: 18px;
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        justify-content: center;
    }
    .e-actions .btn {
        margin-top: 0;
        padding: 14px 22px;
        font-size: 11px;
    }
</style>
