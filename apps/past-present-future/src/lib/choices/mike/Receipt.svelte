<script>
    import { LOGO_SVG } from "$lib/choices/logo.js";

    let { lines = [], printGen = 0, onprintline } = $props();

    let srcOpen = $state(false);

    let el;
    const PER_LINE = 125;

    $effect(() => {
        if (printGen === 0 || !el) return;
        void lines;
        const rows = [...el.children];
        const timers = [];
        for (const r of rows) {
            r.style.opacity = "0";
            r.style.transform = "translateY(-5px)";
            r.style.transition = "opacity .1s ease, transform .1s ease";
        }
        rows.forEach((r, i) => {
            timers.push(
                setTimeout(() => {
                    r.style.opacity = "1";
                    r.style.transform = "translateY(0)";
                    onprintline?.();
                }, i * PER_LINE),
            );
        });
        timers.push(
            setTimeout(
                () => {
                    for (const r of rows) {
                        r.style.transition = "";
                        r.style.transform = "";
                    }
                },
                rows.length * PER_LINE + 220,
            ),
        );
        return () => timers.forEach(clearTimeout);
    });
</script>

<div
    class="receipt"
    bind:this={el}
    style:visibility={printGen === 0 ? "hidden" : undefined}
>
    {#each lines as line}
        {#if line.t === "brand"}
            <div class="rc-brand">{@html LOGO_SVG}</div>
        {:else if line.t === "title"}
            <div class="rc-title">Life’s Choices</div>
        {:else if line.t === "meta"}
            <div class="rc-meta">{line.text}</div>
        {:else if line.t === "rule"}
            <div class="rc-rule"></div>
        {:else if line.t === "sub"}
            <div class="rc-sub">{line.text}</div>
        {:else if line.t === "row"}
            <div class="rc-row {line.cls}">
                <span class="rc-lbl">{line.label}</span><span class="rc-amt"
                    >{line.amount}</span
                >
            </div>
        {:else if line.t === "total"}
            <div class="rc-tot" class:saved={line.saved}>
                <span class="rc-lbl">{line.label ?? "Total debt"}</span><span class="rc-amt"
                    >{line.amount}</span
                >
            </div>
        {:else if line.t === "sources"}
            <div class="rc-sources">
                <button
                    class="rc-src-head"
                    type="button"
                    aria-expanded={srcOpen}
                    onclick={() => (srcOpen = !srcOpen)}
                    >Sources <svg
                        class="rc-src-arw"
                        class:open={srcOpen}
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg
                    ></button
                >
                {#if srcOpen}
                    {#each line.items as it}
                        <span class="rc-src-item">
                            {#if it.url}<a
                                    href={it.url}
                                    target="_blank"
                                    rel="noopener">{it.name}</a
                                >{:else}{it.name}{/if}
                        </span>
                    {/each}
                {/if}
            </div>
        {/if}
    {/each}
</div>

<style>
    .receipt {
        --ri: #1c2a24;
        --ri-soft: rgba(28, 42, 36, 0.62);
        --ri-line: rgba(28, 42, 36, 0.3);
        --ri-save: #2f7a33;
        --ri-owe: #c62f1f;
        width: min(390px, 100%);
        margin: 18px auto 0;
        padding: 20px 22px 20px;
        text-align: left;
        background: #efe7d1;
        color: var(--ri);
        border-radius: 8px;
        box-shadow:
            0 22px 55px -18px rgba(0, 0, 0, 0.7),
            0 1px 0 rgba(255, 255, 255, 0.5) inset;
        font-family: var(--code);
    }
    .receipt .rc-brand {
        display: flex;
        justify-content: center;
        margin-bottom: 9px;
    }
    .rc-brand :global(svg) {
        height: 30px;
        width: auto;
        color: var(--ri);
    }
    .receipt .rc-title {
        text-align: center;
        font-family: var(--display);
        font-weight: 400;
        font-size: 23px;
        line-height: 1;
        letter-spacing: 0.005em;
        color: var(--ri);
    }
    .receipt .rc-meta {
        text-align: center;
        font-size: 9.5px;
        letter-spacing: 0.13em;
        text-transform: uppercase;
        color: var(--ri-soft);
        margin-top: 8px;
        line-height: 1.5;
    }
    .receipt .rc-rule {
        border-top: 1px dashed var(--ri-line);
        margin: 13px 0 11px;
    }
    .receipt .rc-sub {
        font-size: 9.5px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--ri-soft);
        text-align: center;
        margin: 2px 0 8px;
    }
    .receipt .rc-row {
        display: flex;
        gap: 12px;
        font-size: 12.5px;
        line-height: 1.62;
        color: rgba(28, 42, 36, 0.9);
    }
    .receipt .rc-row .rc-lbl {
        flex: 1;
    }
    .receipt .rc-row .rc-amt {
        white-space: nowrap;
        color: var(--ri);
        font-variant-numeric: tabular-nums;
    }
    .receipt .rc-row.pos .rc-amt {
        color: var(--ri-save);
    }
    .receipt .rc-row.neg .rc-amt {
        color: var(--ri-owe);
    }
    .receipt .rc-row.sep {
        border-top: 1px dashed var(--ri-line);
        margin-top: 8px;
        padding-top: 10px;
    }
    .receipt .rc-row.foot {
        margin-top: 6px;
        font-size: 13.5px;
        letter-spacing: 0.02em;
        text-transform: uppercase;
    }
    .receipt .rc-row.foot .rc-lbl {
        color: var(--ri-soft);
    }
    .receipt .rc-row.foot .rc-amt {
        color: var(--ri-owe);
        font-weight: 600;
    }
    .receipt .rc-row.foot.pos .rc-amt {
        color: var(--ri-save);
    }
    .receipt .rc-tot {
        display: flex;
        gap: 12px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--ri-line);
        font-size: 14px;
        letter-spacing: 0.03em;
        text-transform: uppercase;
    }
    .receipt .rc-tot .rc-lbl {
        flex: 1;
        color: var(--ri);
    }
    .receipt .rc-tot .rc-amt {
        color: var(--ri-owe);
        font-weight: 700;
        font-variant-numeric: tabular-nums;
    }
    .receipt .rc-tot.saved .rc-amt {
        color: var(--ri-save);
    }
    .receipt .rc-sources {
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px dashed var(--ri-line);
        display: flex;
        flex-direction: column;
        gap: 3px;
    }
    .receipt .rc-sources .rc-src-head {
        font-size: 9.5px;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: var(--ri-soft);
        margin-bottom: 4px;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        font-family: inherit;
        text-align: left;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    .receipt .rc-src-arw {
        display: block;
        flex: none;
        transition: transform 0.25s ease;
    }
    .receipt .rc-src-arw.open {
        transform: rotate(90deg);
    }
    .receipt .rc-sources .rc-src-item {
        font-size: 11px;
        line-height: 1.6;
        color: rgba(28, 42, 36, 0.78);
    }
    .receipt .rc-src-item a {
        color: inherit;
        text-decoration: underline;
        text-underline-offset: 2px;
        text-decoration-color: rgba(28, 42, 36, 0.45);
        transition:
            color 0.2s,
            text-decoration-color 0.2s;
    }
    .receipt .rc-src-item a:hover {
        color: #000;
        text-decoration-color: #000;
    }
</style>
