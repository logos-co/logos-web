<script>
    import { nairaShort } from "./ledger.js";

    /* One thin line across the bottom. AGE left, UNACCOUNTED right, a dot that
       moves on each decision, the five ages under it. */
    let { show = false, ages = [], idx = 0 } = $props();

    let shown = $state(0);
    let target = $state(0);
    let bumps = $state(0);
    let raf = null;

    const prog = $derived((idx / Math.max(1, ages.length - 1)) * 100 + "%");

    export function reset() {
        if (raf) cancelAnimationFrame(raf);
        shown = target = 0;
    }
    export function animate(end) {
        const start = shown,
            t0 = performance.now(),
            dur = 1000;
        target = end;
        if (raf) cancelAnimationFrame(raf);
        const step = (now) => {
            const k = Math.min(1, (now - t0) / dur);
            shown = k < 1 ? start + (end - start) * (1 - Math.pow(1 - k, 3)) : end;
            if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        bumps++;
    }

    $effect(() => () => raf && cancelAnimationFrame(raf));
</script>

<div id="tl" class:show class:hot={target > 0} style:--prog={prog}>
    <div class="tl-top">
        <span class="tl-label">Age <b>{ages[Math.min(idx, ages.length - 1)]}</b></span>
        <span class="tl-label tl-money">Unaccounted
            <!-- a new element per change, so the bump replays -->
            {#key bumps}<b class:bump={bumps > 0}>{nairaShort(shown)}</b>{/key}</span
        >
    </div>
    <div class="tl-bar"><span class="tl-head"></span></div>
    <div class="tl-ages">
        {#each ages as a, i}
            <span class:active={i === idx} class:done={i < idx}>{a}</span>
        {/each}
    </div>
</div>

<style>
    #tl {
        position: absolute;
        left: 48px;
        right: 48px;
        bottom: calc(24px + env(safe-area-inset-bottom, 0px));
        z-index: 27;
        display: none;
        pointer-events: none;
    }
    #tl.show {
        display: block;
    }
    /* a soft scrim so the bar reads over bright daylight footage */
    #tl::after {
        content: "";
        position: absolute;
        left: -60px;
        right: -60px;
        top: -46px;
        bottom: calc(-30px - env(safe-area-inset-bottom, 0px));
        z-index: -1;
        pointer-events: none;
        background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.78) 0%,
            rgba(0, 0, 0, 0.5) 55%,
            transparent 100%
        );
    }
    .tl-top {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 11px;
    }
    .tl-label {
        font-family: var(--code);
        font-size: 11px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: rgba(236, 236, 228, 0.55);
    }
    .tl-label b {
        font-family: var(--sans);
        font-weight: 600;
        color: #fff;
        letter-spacing: 0;
        font-size: 15px;
        margin-left: 4px;
        vertical-align: -1px;
    }
    .tl-money b {
        font-size: 21px;
        letter-spacing: -0.01em;
        display: inline-block;
        transform-origin: right center;
        font-variant-numeric: tabular-nums;
    }
    #tl.hot .tl-money b {
        color: var(--bad);
    }
    .tl-money b.bump {
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
    .tl-bar {
        height: 1px;
        background: rgba(236, 236, 228, 0.18);
        position: relative;
        margin-bottom: 9px;
    }
    .tl-bar::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        height: 1px;
        background: var(--paper);
        width: var(--prog, 0%);
        transition: width 0.5s ease;
    }
    .tl-head {
        position: absolute;
        top: 50%;
        left: var(--prog, 0%);
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--paper);
        transform: translate(-50%, -50%);
        box-shadow: 0 0 0 4px rgba(236, 236, 228, 0.12);
        transition: left 0.5s ease;
    }
    .tl-ages {
        display: flex;
        justify-content: space-between;
    }
    .tl-ages span {
        font-family: var(--code);
        font-size: 12px;
        letter-spacing: 0.1em;
        color: rgba(236, 236, 228, 0.45);
        transition: color 0.45s ease;
    }
    .tl-ages span.active {
        color: #fff;
        font-weight: 600;
    }
    .tl-ages span.done {
        color: rgba(236, 236, 228, 0.75);
    }
    @media (max-width: 680px) {
        #tl {
            left: 22px;
            right: 22px;
            bottom: calc(16px + env(safe-area-inset-bottom, 0px));
        }
        .tl-label {
            font-size: 9.5px;
        }
        .tl-label b {
            font-size: 13px;
        }
        .tl-money b {
            font-size: 17px;
        }
        .tl-ages span {
            font-size: 10.5px;
        }
    }
</style>
