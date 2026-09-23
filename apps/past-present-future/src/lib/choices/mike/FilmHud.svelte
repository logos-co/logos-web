<script>
    let { showControls = false, muted = false, onmute } = $props();
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
    #mute {
        right: 22px;
    }
    #mute.show {
        display: flex;
    }
    #mute:hover {
        color: var(--signal);
    }
    #mute svg {
        width: 19px;
        height: 15px;
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
        #mute {
            top: 51px;
            right: 16px;
            width: 30px;
            height: 30px;
        }
    }
</style>
