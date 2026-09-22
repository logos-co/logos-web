<script>
    let {
        scenes = [],
        idx = 0,
        prog = 0,
        debtTxt = "£0",
        indebt = false,
        visible = false,
        bumpKey = 0,
    } = $props();
</script>

<div id="timeline" class:indebt class:visible style="--prog:{prog}%">
    <div class="tl-top">
        <div class="tl-label">
            AGE <span class="tl-now">{scenes[idx]?.age}</span>
        </div>
        <div class="tl-label tl-debt">
            DEBT
            {#key bumpKey}
                <span class="tl-debt-num" class:bump={bumpKey > 0}
                    >{debtTxt}</span
                >
            {/key}
        </div>
    </div>
    <div class="tl-bar"><span class="tl-head"></span></div>
    <div class="tl-ages">
        {#each scenes as s, k}
            <span class:active={k === idx}>{s.age}</span>
        {/each}
    </div>
</div>

<style>
    #timeline {
        position: absolute;
        left: 48px;
        right: 48px;
        bottom: 22px;
        z-index: 27;
        display: none;
        pointer-events: none;
    }
    #timeline.visible {
        display: block;
    }
    .tl-top {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 11px;
    }
    .tl-label {
        font-family: var(--sans);
        font-size: 12px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: rgba(236, 236, 228, 0.55);
    }
    .tl-label .tl-now {
        color: rgba(236, 236, 228, 0.9);
        font-weight: 600;
    }
    .tl-debt {
        font-size: 12px;
        color: rgba(236, 236, 228, 0.6);
    }
    .tl-debt .tl-debt-num {
        display: inline-block;
        margin-left: 4px;
        font-size: 21px;
        font-weight: 700;
        letter-spacing: 0.005em;
        color: #fff;
        transform-origin: right center;
        vertical-align: -2px;
    }
    #timeline.indebt .tl-debt .tl-debt-num {
        color: var(--alert);
    }
    .tl-debt .tl-debt-num.bump {
        animation: debtBump 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes debtBump {
        0% {
            transform: scale(1);
        }
        26% {
            transform: scale(1.24);
        }
        100% {
            transform: scale(1);
        }
    }
    .tl-bar {
        height: 1px;
        background: rgba(236, 236, 228, 0.16);
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
        transition: width 0.3s linear;
    }
    .tl-bar .tl-head {
        position: absolute;
        top: 50%;
        left: var(--prog, 0%);
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--paper);
        transform: translate(-50%, -50%);
        box-shadow: 0 0 0 4px rgba(236, 236, 228, 0.12);
        transition: left 0.3s linear;
    }
    .tl-ages {
        display: flex;
        justify-content: space-between;
    }
    .tl-ages span {
        font-family: var(--sans);
        font-size: 13px;
        letter-spacing: 0.1em;
        color: rgba(236, 236, 228, 0.55);
        transition: color 0.45s ease;
    }
    .tl-ages span.active {
        color: #fff;
        font-weight: 600;
    }
    @media (max-width: 640px) {
        #timeline {
            left: 24px;
            right: 24px;
            bottom: 14px;
        }
        .tl-ages span,
        .tl-label {
            font-size: 10px;
        }
    }
</style>
