<script>
    import Receipt from "./Receipt.svelte";

    let {
        on = false,
        view = "bill", // 'bill' | 'tally'
        good = true,
        debtText = "",
        typing = false,
        why = "",
        src = null,
        override = false,
        nextLabel = "See the receipt ►",
        tallyLines = [],
        printGen = 0,
        onprintline,
        onnext,
        el = $bindable(null),
    } = $props();
</script>

<section id="outcome" class:on bind:this={el}>
    <div class="o-inner">
        <div class="o-view" class:on={view === "bill"}>
            <div class="o-debt" class:good class:bad={!good} class:typing>
                {debtText}
            </div>
            <div class="o-why">{why}</div>
            <div class="o-src">
                {#if src}Source · {#if src.url}<a
                            href={src.url}
                            target="_blank"
                            rel="noopener">{src.name}</a
                        >{:else}{src.name}{/if}{/if}
            </div>
            <div class="o-override" class:on={override}>
                ⚠ THE SYSTEM CHOSE FOR YOU
            </div>
        </div>
        <div class="o-view" class:on={view === "tally"}>
            <Receipt lines={tallyLines} {printGen} {onprintline} />
        </div>
        <button class="btn" onclick={onnext}>{nextLabel}</button>
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
        padding: 5vh 6vw;
        pointer-events: auto;
        overflow-y: auto;
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
    #outcome .o-inner {
        position: relative;
        width: 100%;
        max-width: 640px;
        margin: auto 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        pointer-events: auto;
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
    .o-view :global(.receipt) {
        max-height: calc(100dvh - 230px);
        overflow-y: auto;
    }
    .o-debt {
        font-family: var(--display);
        font-weight: 400;
        font-size: clamp(26px, 4vw, 50px);
        line-height: 1;
        letter-spacing: -0.01em;
    }
    .o-debt.good {
        color: var(--save);
    }
    .o-debt.bad {
        color: var(--alert);
    }
    .o-debt.typing::after {
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
        margin-top: 18px;
        font-family: var(--sans);
        font-size: clamp(15px, 1.7vw, 18px);
        letter-spacing: 0.004em;
        color: var(--signal);
        max-width: 40ch;
        line-height: 1.55;
    }
    @media (min-width: 761px) {
        .o-why {
            max-width: 46ch;
        }
    }
    .o-src {
        margin-top: 12px;
        font-family: var(--sans);
        font-size: 12px;
        letter-spacing: 0.02em;
        color: rgba(236, 236, 228, 0.5);
    }
    .o-src a {
        color: inherit;
        text-decoration: underline;
        text-underline-offset: 2px;
        text-decoration-color: rgba(236, 236, 228, 0.4);
        transition:
            color 0.2s,
            text-decoration-color 0.2s;
    }
    .o-src a:hover {
        color: var(--signal);
        text-decoration-color: var(--signal);
    }
    .o-override {
        margin-top: 22px;
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
    #outcome .btn {
        margin-top: 26px;
        flex: none;
    }
    @media (max-width: 640px) {
        #outcome {
            padding: 6vw;
        }
        #outcome:has(.o-view.on :global(.receipt)) {
            padding-top: 94px;
        }
        #outcome:has(.o-view.on :global(.receipt)) .o-inner {
            margin: 0;
        }
        .o-view :global(.receipt) {
            max-height: calc(100dvh - 218px);
        }
    }
</style>
