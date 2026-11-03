<script>
    import Statement from "./Statement.svelte";
    import { naira, costText } from "./ledger.js";

    /* two pages, like Mike's receipt.
       page 1: what just happened + the fact. page 2: the statement so far. */
    let {
        on = false,
        head = "",
        typing = false,
        why = "",
        entry = null,
        src = null,
        override = false,
        data,
        onnext,
    } = $props();

    let view = $state("fact");
    let el, sheet;

    export function reset() {
        view = "fact";
        if (el) el.scrollTop = 0;
    }
    export function next() {
        if (view === "fact") {
            view = "statement";
            if (el) el.scrollTop = 0;
            sheet?.print();
        } else onnext?.();
    }
</script>

<section id="outcome" class:on bind:this={el}>
    <div class="o-inner">
        <div class="o-view" class:on={view === "fact"}>
            <div class="o-head" class:typing>{head}</div>
            <div class="o-why">{why}</div>
            <!-- this decision's money, in one plain sentence -->
            {#if entry}
                <div class="o-money">
                    {#if !entry.inAmt}No money came in this time.{:else if !entry.outAmt}<b
                            >{naira(entry.inAmt)}</b
                        > came in and all of it went to the canal.{:else if entry.filed}<b
                            >{naira(entry.inAmt)}</b
                        > came in. <b>{naira(entry.outAmt)}</b> of it went on {costText(
                            entry,
                        )}. You put that in a report.{:else}<b>{naira(entry.inAmt)}</b>
                        came in. <b class="miss">{naira(entry.outAmt)}</b> of it went on
                        {costText(entry)}. Nobody wrote that down.{/if}
                </div>
            {/if}
            <div class="o-src">
                {#if src}Source · {#if src.url}<a
                            href={src.url}
                            target="_blank"
                            rel="noopener">{src.name}</a
                        >{:else}{src.name}{/if}{/if}
            </div>
            <div class="o-override" class:on={override}>
                ⚠ THE ROOM CHOSE FOR YOU
            </div>
        </div>
        <div class="o-view" class:on={view === "statement"}>
            <Statement bind:this={sheet} mode="running" now={entry?.n} age={entry?.age} {data} />
        </div>
        <!-- stays in reach while the statement scrolls under it -->
        <div class="o-next">
            <button class="btn" id="oNext" onclick={next}
                >{view === "fact" ? "See the statement ►" : "Continue ►"}</button
            >
        </div>
    </div>
</section>

<style>
    #outcome {
        position: absolute;
        inset: 0;
        z-index: 28;
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        text-align: center;
        /* the bottom padding lives in .o-next, so nothing shows under the sticky button */
        --pb: 5vh;
        padding: 5vh 6vw 0;
        pointer-events: auto;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
    }
    #outcome.on {
        display: flex;
    }
    #outcome::before {
        content: "";
        position: fixed;
        inset: 0;
        background: rgba(6, 8, 7, 0.955);
        z-index: -1;
    }
    .o-inner {
        position: relative;
        width: 100%;
        max-width: 640px;
        margin: auto 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    .o-next {
        position: sticky;
        bottom: 0;
        z-index: 3;
        width: 100%;
        margin-top: 8px;
        padding: 18px 0 var(--pb);
        background: linear-gradient(to bottom, rgba(6, 8, 7, 0), rgba(6, 8, 7, 0.955) 45%);
    }
    #oNext {
        margin-top: 0;
    }
    .o-view {
        display: none;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }
    .o-view.on {
        display: flex;
    }
    .o-head {
        font-family: var(--display);
        font-weight: 400;
        font-size: clamp(26px, 4vw, 50px);
        line-height: 1.02;
        letter-spacing: -0.01em;
        color: var(--signal);
    }
    .o-head.typing::after {
        content: "";
        display: inline-block;
        width: 0.5ch;
        height: 0.9em;
        margin-left: 0.06em;
        background: currentColor;
        transform: translateY(0.06em);
        animation: caret 0.5s steps(1) infinite;
    }
    @keyframes caret {
        50% {
            opacity: 0;
        }
    }
    .o-why {
        margin-top: 20px;
        font-family: var(--sans);
        font-size: clamp(15px, 1.7vw, 18px);
        color: var(--signal);
        max-width: 44ch;
        line-height: 1.55;
    }
    .o-money {
        margin-top: 18px;
        padding: 12px 16px;
        border: 1px solid rgba(236, 236, 228, 0.16);
        border-radius: 12px;
        font-family: var(--code);
        font-size: 12.5px;
        line-height: 1.55;
        color: rgba(236, 236, 228, 0.85);
        max-width: 46ch;
    }
    .o-money b {
        font-weight: 500;
        color: var(--signal);
    }
    .o-money b.miss {
        color: var(--bad);
    }
    .o-src {
        margin-top: 14px;
        font-family: var(--code);
        font-size: 12px;
        letter-spacing: 0.02em;
        color: rgba(236, 236, 228, 0.5);
    }
    .o-src a {
        color: inherit;
        text-decoration: underline;
        text-underline-offset: 2px;
    }
    .o-override {
        margin-top: 22px;
        font-family: var(--code);
        font-size: 11px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--alert);
        opacity: 0;
    }
    .o-override.on {
        opacity: 1;
        animation: ovflick 0.5s steps(2) 3;
    }
    @keyframes ovflick {
        50% {
            opacity: 0.2;
        }
    }
    /* clear the nav mark on phones, and keep scrolled text from running under it */
    @media (max-width: 680px) {
        #outcome {
            --pb: calc(16px + env(safe-area-inset-bottom, 0px));
            padding: 84px 6vw 0;
        }
        #outcome::after {
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
    @media (min-aspect-ratio: 5/7) and (max-height: 560px) {
        #outcome {
            padding-top: 56px;
        }
        .o-head {
            font-size: 24px;
        }
        .o-why {
            margin-top: 12px;
            font-size: 14px;
            line-height: 1.5;
        }
        .o-money {
            margin-top: 12px;
        }
        .o-next {
            padding-top: 12px;
        }
    }
</style>
