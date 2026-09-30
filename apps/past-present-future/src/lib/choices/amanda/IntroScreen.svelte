<script>
    let {
        on = false,
        fontsIn = false,
        title,
        cta,
        children,
        chrome,
        onbegin,
        onhover,
    } = $props();
</script>

<section class="screen" id="intro" class:on class:fonts-in={fontsIn}>
    {@render chrome?.()}
    <div class="intro-band">
        <h1>{title}</h1>
        <div class="sub">{@render children?.()}</div>
        <button
            class="btn"
            onclick={onbegin}
            onmouseenter={() => onhover?.(true)}
            onmouseleave={() => onhover?.(false)}>{cta}</button
        >
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

    #intro::before {
        background: var(
            --intro-veil,
            radial-gradient(
                120% 90% at 50% 46%,
                rgba(6, 8, 7, 0.28) 0%,
                rgba(6, 8, 7, 0.62) 62%,
                rgba(6, 8, 7, 0.82) 100%
            )
        );
    }
    .intro-band {
        position: relative;
        width: 100%;
        text-align: center;
    }
    #intro .intro-band {
        transition: opacity 0.45s ease;
    }
    #intro:not(.fonts-in) .intro-band {
        opacity: 0;
    }
    @media (min-width: 681px) {
        #intro h1 {
            white-space: nowrap;
        }
    }
    @keyframes riseIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    #intro.on h1 {
        animation: riseIn 1.15s cubic-bezier(0.16, 1, 0.3, 1) both 0.2s;
    }
    #intro.on .sub {
        animation: riseIn 1s cubic-bezier(0.16, 1, 0.3, 1) both 0.46s;
    }
    #intro.on .btn {
        animation: riseIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) both 0.66s;
    }
    h1 {
        font-family: var(--display);
        font-weight: 400;
        line-height: 0.9;
        letter-spacing: -0.03em;
        text-transform: none;
        font-size: clamp(40px, 7.6vw, 104px);
        color: var(--paper);
    }
    .sub {
        font-family: var(--sans);
        font-size: clamp(13px, 1.15vw, 15px);
        line-height: 1.7;
        letter-spacing: var(--intro-sub-ls, 0.005em);
        color: rgba(236, 236, 228, 0.75);
        margin: 26px auto 0;
        max-width: 600px;
    }
    .sub :global(.q) {
        color: var(--signal);
    }
</style>
