<script>
    import Receipt from "./Receipt.svelte";
    import { ENDING_FACT } from "$lib/choices/scenes.js";

    let {
        on = false,
        receiptLines = [],
        printGen = 0,
        onprintline,
        onreplay,
        onshare,
    } = $props();
</script>

<section class="screen" id="ending" class:on>
    <div class="kick"></div>
    <div class="end-fact">
        <div class="fk">◆ A Real Fact</div>
        <div>{ENDING_FACT.text}</div>
        <div class="fs">
            Source · <a href={ENDING_FACT.url} target="_blank" rel="noopener"
                >{ENDING_FACT.src}</a
            >
        </div>
    </div>
    <Receipt lines={receiptLines} {printGen} {onprintline} />
    <div class="end-out">
        <div class="eo-line">
            This loop is by design. It can be broken, and you don’t have to do
            it alone.
        </div>
        <a
            class="btn primary eo-cta"
            href="https://logos.co/movement#circles-map"
            target="_blank"
            rel="noopener">Exit the loop → Join a Circle</a
        >
    </div>
    <div class="e-actions">
        <button class="btn" onclick={onreplay}>Live it again</button>
        <a class="btn" href="/past-present-future/choices">Live as someone else</a>
        <button class="btn" onclick={onshare}>Share the receipt on X</button>
    </div>
</section>

<style>
    .screen {
        position: absolute;
        inset: 0;
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 30;
        padding: 8vw;
        text-align: center;
    }
    .screen.on {
        display: flex;
    }
    .screen::before {
        content: "";
        position: absolute;
        inset: 0;
        background: rgba(6, 8, 7, 0.5);
        z-index: -1;
    }
    #ending {
        justify-content: flex-start;
        overflow-y: auto;
        /* extra bottom room so buttons clear the rounded shell corner */
        padding: 4vh 8vw calc(4vh + 28px);
    }
    #ending::before {
        position: fixed;
    }
    #ending .kick {
        margin-top: auto;
    }
    #ending .e-actions {
        margin-bottom: auto;
    }
    .kick {
        font-size: 12px;
        letter-spacing: 0.36em;
        color: rgba(236, 236, 228, 0.7);
        text-transform: uppercase;
    }

    .end-fact {
        margin-top: 0;
        max-width: min(52ch, 86vw);
        font-family: var(--sans);
        font-size: clamp(13px, 1.15vw, 15px);
        line-height: 1.65;
        letter-spacing: 0.01em;
        color: rgba(236, 236, 228, 0.82);
        text-align: center;
    }
    @media (min-width: 761px) {
        .end-fact {
            max-width: min(62ch, 86vw);
        }
    }
    .end-fact .fk {
        display: none;
    }
    .end-fact .fs {
        margin-top: 14px;
        font-size: 11px;
        letter-spacing: 0.04em;
        color: rgba(236, 236, 228, 0.45);
    }
    .end-fact .fs a {
        color: inherit;
        text-decoration: underline;
        text-underline-offset: 2px;
        text-decoration-color: rgba(236, 236, 228, 0.4);
        transition:
            color 0.2s,
            text-decoration-color 0.2s;
    }
    .end-fact .fs a:hover {
        color: var(--signal);
        text-decoration-color: var(--signal);
    }

    .end-out {
        margin-top: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 22px;
    }
    .end-out .eo-line {
        font-family: var(--sans);
        font-size: clamp(14px, 1.5vw, 18px);
        line-height: 1.5;
        letter-spacing: 0.004em;
        color: var(--signal);
        max-width: 44ch;
    }
    .end-out .eo-cta {
        margin-top: 0;
        padding: 17px 32px;
        font-size: 12px;
        letter-spacing: 0.16em;
    }
    @media (max-width: 640px) {
        .end-out .eo-cta {
            padding: 15px 16px;
            font-size: 11px;
            letter-spacing: 0.12em;
            white-space: nowrap;
        }
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

    /* Short, wide screens (laptops with browser chrome): receipt left,
       fact + CTA + actions right, so nothing falls below the fold. */
    @media (min-width: 900px) and (max-height: 820px) {
        #ending.on {
            display: grid;
            grid-template-columns: minmax(0, 390px) minmax(0, 460px);
            grid-template-areas:
                "receipt fact"
                "receipt out"
                "receipt actions";
            grid-template-rows: auto auto auto;
            column-gap: 56px;
            align-content: center;
            justify-content: center;
            align-items: center;
            padding: 4vh 6vw;
        }
        #ending .kick {
            display: none;
        }
        #ending .end-fact {
            grid-area: fact;
            align-self: end;
            max-width: none;
        }
        #ending :global(.receipt) {
            grid-area: receipt;
            margin: 0;
        }
        #ending .end-out {
            grid-area: out;
            margin-top: 22px;
        }
        #ending .e-actions {
            grid-area: actions;
            align-self: start;
            margin: 16px 0 0;
        }
    }
</style>
