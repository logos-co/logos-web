<script>
    let {
        on = false,
        urgent = false,
        age = "",
        title = "",
        prompt = "",
        a = "",
        b = "",
        timeText = "CHOOSE",
        armed = "",
        timerScale = 1,
        onpick,
    } = $props();
</script>

<section id="choice" class:on class:urgent>
    <div class="c-head">
        <div class="c-age">{age}</div>
        <div class="c-title">{title}</div>
        <div class="c-prompt">{prompt}</div>
    </div>
    <div class="c-timetext">{timeText}</div>
    <div class="c-timerwrap">
        <div class="c-timer" style:transform="scaleX({timerScale})"></div>
    </div>
    <div class="c-opts">
        <button
            class="copt"
            class:armed={armed === "A"}
            onclick={() => onpick?.("A")}
            ><span class="ckey">A</span><span class="clabel">{a}</span></button
        >
        <button
            class="copt"
            class:armed={armed === "B"}
            onclick={() => onpick?.("B")}
            ><span class="ckey">B</span><span class="clabel">{b}</span></button
        >
    </div>
</section>

<style>
    #choice {
        position: absolute;
        inset: 0;
        z-index: 25;
        display: none;
        flex-direction: column;
        justify-content: flex-end;
        pointer-events: none;
    }
    #choice.on {
        display: flex;
    }
    #choice::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.92) 0%,
            rgba(0, 0, 0, 0.6) 40%,
            transparent 74%
        );
        z-index: -1;
    }
    #choice.on .c-head {
        animation: cuprise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    #choice.on .c-timetext,
    #choice.on .c-timerwrap {
        animation: cuprise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both 0.06s;
    }
    #choice.on .copt {
        animation: cuprise 0.75s cubic-bezier(0.16, 1, 0.3, 1) both 0.12s;
    }
    @keyframes cuprise {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .c-head {
        text-align: center;
        margin-top: auto;
        padding: 0 6vw 4px;
    }
    .c-age {
        font-size: 12px;
        letter-spacing: 0.06em;
        color: rgba(236, 236, 228, 0.6);
    }
    .c-title {
        font-family: var(--display);
        font-weight: 400;
        font-size: clamp(26px, 3.6vw, 54px);
        line-height: 0.98;
        letter-spacing: -0.015em;
        margin-top: 10px;
        text-shadow: 0 2px 24px rgba(0, 0, 0, 0.9);
        color: var(--paper);
    }
    .c-prompt {
        font-family: var(--sans);
        font-size: clamp(13px, 1.25vw, 15px);
        line-height: 1.55;
        letter-spacing: 0.005em;
        color: rgba(236, 236, 228, 0.82);
        margin: 12px auto 0;
        max-width: 52ch;
        text-shadow: 0 1px 18px rgba(0, 0, 0, 0.95);
    }
    @media (min-width: 761px) {
        .c-prompt {
            max-width: 62ch;
        }
    }
    .c-timetext {
        text-align: center;
        font-size: 11px;
        letter-spacing: 0.24em;
        color: rgba(236, 236, 228, 0.6);
        text-transform: uppercase;
        margin: 22px 0 10px;
    }
    #choice.urgent .c-timetext {
        color: var(--alert);
    }
    .c-timerwrap {
        position: relative;
        width: min(560px, 72vw);
        height: 3px;
        margin: 0 auto 24px;
        background: rgba(236, 236, 228, 0.18);
        overflow: hidden;
    }
    .c-timer {
        position: absolute;
        inset: 0;
        transform-origin: left center;
        transform: scaleX(1);
        background: var(--signal);
    }
    #choice.urgent .c-timer {
        background: var(--alert);
    }
    .c-opts {
        display: flex;
        width: 100%;
        pointer-events: auto;
        border-top: 1px solid rgba(236, 236, 228, 0.14);
    }
    .copt {
        flex: 1;
        background: none;
        border: none;
        padding: 4.5vh 4vw 6vh;
        cursor: pointer;
        color: var(--paper);
        font-family: var(--sans);
        transition:
            background 0.2s,
            transform 0.2s;
        text-align: center;
        position: relative;
    }
    .copt + .copt {
        border-left: 1px solid rgba(236, 236, 228, 0.14);
    }
    .copt:hover,
    .copt.armed {
        background: rgba(236, 236, 228, 0.07);
    }
    .copt:hover {
        transform: translateY(-4px);
    }
    .ckey {
        display: none;
    }
    .clabel {
        display: block;
        font-family: var(--display);
        font-weight: 400;
        font-size: clamp(22px, 2.6vw, 40px);
        line-height: 1.02;
        letter-spacing: -0.015em;
        transition: color 0.2s;
    }
    .copt:hover .clabel,
    .copt.armed .clabel {
        color: var(--signal);
    }
    @media (max-width: 760px) {
        .c-opts {
            flex-direction: column;
        }
        .copt {
            padding: 3.4vh 6vw;
        }
        .copt + .copt {
            border-left: none;
            border-top: 1px solid rgba(236, 236, 228, 0.14);
        }
        #choice {
            padding-bottom: 70px;
            overflow-y: auto;
        }
    }
</style>
