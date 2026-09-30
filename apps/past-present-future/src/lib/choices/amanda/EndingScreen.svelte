<script>
    import { base } from "$app/paths";
    import Dashboard from "./Dashboard.svelte";
    import { ENDING_FACT } from "./film.js";

    let {
        on = false,
        dash = null,
        dashEl = $bindable(),
        onreplay,
        onshare,
    } = $props();
</script>

<section class="screen" id="ending" class:on>
    <div class="kick">NOTHING WAS TAKEN</div>
    <h1>It was all <br />given away.</h1>
    <div class="end-fact">
        <div>{ENDING_FACT.text}</div>
        <div class="fs">{ENDING_FACT.src}</div>
    </div>
    {#if dash}
        <Dashboard id="endDash" wide {...dash} bind:this={dashEl} />
    {/if}
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
        <a class="btn" href="{base}/choices">Live as someone else</a>
        <button class="btn" onclick={onshare}>Share the report on X</button>
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
        position: fixed;
        inset: 0;
        background: rgba(6, 8, 7, 0.62);
        z-index: -1;
    }
    #ending {
        justify-content: flex-start;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 5vh 8vw;
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
        margin-bottom: 18px;
    }
    h1 {
        font-family: var(--display);
        font-weight: 400;
        font-size: clamp(34px, 4.4vw, 64px);
        line-height: 0.9;
        letter-spacing: -0.03em;
        text-transform: none;
    }
    .end-fact {
        margin-top: 24px;
        max-width: min(52ch, 100%);
        font-family: var(--sans);
        font-size: clamp(13px, 1.15vw, 15px);
        line-height: 1.65;
        color: rgba(236, 236, 228, 0.82);
        text-align: center;
    }
    @media (min-width: 761px) {
        .end-fact {
            max-width: min(62ch, 100%);
        }
    }
    .end-fact .fs {
        margin-top: 14px;
        font-family: var(--code);
        font-size: 11px;
        color: rgba(236, 236, 228, 0.45);
    }
    .screen :global(#endDash) {
        margin-top: 24px;
        flex: none;
    }
    @media (max-width: 680px) {
        #ending {
            padding-top: 76px;
        }
    }
    @media (min-width: 761px) {
        #ending {
            padding: 4vh 6vw;
        }
        .kick {
            margin-bottom: 14px;
        }
        h1 {
            font-size: clamp(34px, 3.4vw, 50px);
            line-height: 1;
        }
        h1 br {
            display: none;
        }
        .end-fact {
            margin-top: 16px;
            max-width: min(76ch, 100%);
        }
        .screen :global(#endDash) {
            margin-top: 22px;
            flex: 0 1 auto;
            min-height: 200px;
            overflow-y: auto;
            overscroll-behavior: contain;
            -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 22px), transparent 100%);
            mask-image: linear-gradient(to bottom, #000 calc(100% - 22px), transparent 100%);
        }
        .end-out {
            margin-top: 22px;
            gap: 16px;
        }
        .end-out .eo-line {
            max-width: 72ch;
        }
        .e-actions {
            margin-top: 18px;
        }
    }
    @media (min-width: 761px) and (max-height: 560px) {
        .screen :global(#endDash) {
            flex: none;
            min-height: 0;
            overflow: visible;
            -webkit-mask-image: none;
            mask-image: none;
        }
    }
    .end-out {
        margin-top: 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 22px;
    }
    .end-out .eo-line {
        font-family: var(--sans);
        font-size: clamp(14px, 1.5vw, 18px);
        line-height: 1.5;
        color: var(--signal);
        max-width: 44ch;
    }
    .end-out .eo-cta {
        margin-top: 0;
        padding: 17px 32px;
        font-size: 12px;
        letter-spacing: 0.16em;
    }
    @media (max-width: 680px) {
        .end-out .eo-cta {
            padding: 15px 16px;
            font-size: 11px;
            letter-spacing: 0.12em;
            white-space: nowrap;
        }
    }
    .e-actions {
        margin-top: 26px;
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
    @media (max-width: 680px) {
        #ending::after {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 92px;
            background: linear-gradient(to bottom, rgba(6, 8, 7, 0.94) 45%, rgba(6, 8, 7, 0));
            pointer-events: none;
            z-index: 1;
        }
    }
    @media (max-width: 360px) {
        .end-out .eo-cta {
            padding: 15px 12px;
            letter-spacing: 0.06em;
        }
    }
</style>
