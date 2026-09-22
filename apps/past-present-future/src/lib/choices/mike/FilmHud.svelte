<script>
    let {
        showControls = false,
        showSkip = false,
        paused = false,
        muted = false,
        onplaypause,
        onmute,
        onskip,
    } = $props();
</script>

<button
    id="mute"
    class:muted
    class:show={showControls}
    aria-label={muted ? "Unmute" : "Mute"}
    onclick={(e) => {
        e.stopPropagation();
        onmute?.();
    }}
>
    <svg
        class="i-sound"
        viewBox="0 0 20 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        ><path
            d="M2 6 h3 l4 -3.5 v11 l-4 -3.5 h-3 z"
            fill="currentColor"
            stroke="none"
        /><path d="M12.5 5.5 a3.5 3.5 0 0 1 0 5" /><path
            d="M14.6 3.4 a6 6 0 0 1 0 9.2"
        /></svg
    >
    <svg
        class="i-muted"
        viewBox="0 0 20 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        ><path
            d="M2 6 h3 l4 -3.5 v11 l-4 -3.5 h-3 z"
            fill="currentColor"
            stroke="none"
        /><path d="M12.5 5.5 l5 5 M17.5 5.5 l-5 5" /></svg
    >
</button>


<style>
    #playpause,
    #mute {
        position: absolute;
        top: 20px;
        z-index: 52;
        width: 32px;
        height: 32px;
        display: none;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        border-radius: 50%;
        color: rgba(236, 236, 228, 0.85);
        cursor: pointer;
        transition: color 0.2s;
    }
    #playpause {
        right: 106px;
    }
    #mute {
        right: 22px;
    }
    #playpause.show,
    #mute.show {
        display: flex;
    }
    #playpause:hover,
    #mute:hover {
        color: var(--signal);
    }
    #skip {
        position: absolute;
        top: 22px;
        right: 22px;
        z-index: 52;
        display: none;
        align-items: center;
        gap: 6px;
        padding: 7px 12px;
        background: rgba(6, 8, 7, 0.5);
        border: 1px solid rgba(236, 236, 228, 0.28);
        border-radius: 999px;
        color: rgba(236, 236, 228, 0.9);
        font-family: var(--code);
        font-size: 10px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        cursor: pointer;
        -webkit-backdrop-filter: blur(6px);
        backdrop-filter: blur(6px);
        transition:
            color 0.2s,
            border-color 0.2s;
    }
    #skip svg {
        width: 11px;
        height: 11px;
        fill: currentColor;
        display: block;
    }
    #skip:hover {
        color: var(--signal);
        border-color: rgba(236, 236, 228, 0.5);
    }
    #skip.show {
        display: flex;
    }
    #playpause svg {
        width: 11px;
        height: 13px;
        fill: currentColor;
        display: block;
    }
    #mute svg {
        width: 19px;
        height: 15px;
        display: block;
    }
    #playpause .i-play {
        display: none;
        margin-left: 1px;
    }
    #playpause.paused .i-pause {
        display: none;
    }
    #playpause.paused .i-play {
        display: block;
    }
    #mute .i-muted {
        display: none;
    }
    #mute.muted .i-sound {
        display: none;
    }
    #mute.muted .i-muted {
        display: block;
    }
    @media (max-width: 680px) {
        #playpause {
            top: 51px;
            right: 92px;
            width: 30px;
            height: 30px;
        }
        #mute {
            top: 51px;
            right: 16px;
            width: 30px;
            height: 30px;
        }
        #skip {
            top: 52px;
            right: 16px;
            padding: 6px 10px;
            font-size: 9px;
        }
    }
</style>
