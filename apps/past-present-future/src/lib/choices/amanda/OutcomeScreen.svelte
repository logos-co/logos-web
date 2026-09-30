<script>
    let {
        on = false,
        head = "",
        typing = false,
        why = "",
        src = null,
        override = false,
        onnext,
        el = $bindable(),
    } = $props();
</script>

<section id="outcome" class:on bind:this={el}>
    <div class="o-inner">
        <div class="o-view on">
            <div class="o-head" class:typing>{head}</div>
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
        <div class="o-next">
            <button class="btn" id="oNext" onclick={onnext}>Continue ►</button>
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
    .o-inner {
        position: relative;
        width: 100%;
        max-width: 640px;
        max-height: 100%;
        margin: auto 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    .o-next {
        display: flex;
        justify-content: center;
        width: 100%;
        flex: none;
    }
    #oNext {
        margin-top: 8px;
        flex: none;
    }
    @media (max-aspect-ratio: 5/7) {
        #outcome {
            bottom: var(--panel-h);
            padding: 4vh 6vw 18px;
        }
        #oNext {
            margin-top: 4px;
        }
    }
    @media (max-aspect-ratio: 5/7) and (max-width: 680px) {
        #outcome {
            padding-top: 88px;
        }
    }
    @media (max-aspect-ratio: 5/7) and (max-height: 700px) {
        #outcome {
            padding-bottom: 12px;
        }
        .o-head {
            font-size: 24px;
        }
        .o-why {
            margin-top: 14px;
            font-size: 14px;
            line-height: 1.5;
        }
        .o-src {
            margin-top: 10px;
            font-size: 11px;
        }
        .o-override {
            margin-top: 14px;
        }
        #oNext {
            margin-top: 0;
        }
    }
    @media (min-aspect-ratio: 5/7) and (max-height: 560px) {
        #outcome {
            padding: 56px calc(258px + 34px + 24px) 12px 6vw;
        }
        .o-head {
            font-size: 24px;
        }
        .o-why {
            margin-top: 12px;
            font-size: 14px;
            line-height: 1.5;
        }
        .o-src {
            margin-top: 10px;
            font-size: 11px;
        }
        .o-override {
            margin-top: 12px;
        }
        #oNext {
            margin-top: 0;
        }
    }
    @media (min-aspect-ratio: 5/7) and (max-height: 560px) and (max-width: 680px) {
        #outcome {
            padding-top: 84px;
        }
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
    .o-view {
        flex: 0 1 auto;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-width: none;
        padding-bottom: 18px;
        -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 18px), transparent 100%);
        mask-image: linear-gradient(to bottom, #000 calc(100% - 18px), transparent 100%);
    }
    .o-view::-webkit-scrollbar {
        display: none;
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
</style>
