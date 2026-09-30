const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function frameAt(keys, t, reduce = false) {
    let i = -1;
    for (let k = keys.length - 1; k >= 0; k--) {
        if (t >= keys[k][0]) {
            i = k;
            break;
        }
    }
    if (i < 0) return keys[0][1];
    const [t0, x0] = keys[i];
    const next = keys[i + 1];
    if (!next || x0 == null || next[1] == null || x0 === next[1]) return x0;
    if (reduce) return next[1];
    let u = (t - t0) / (next[0] - t0);
    u = u * u * (3 - 2 * u);
    return x0 + (next[1] - x0) * u;
}

export function createReframe(video, onPos, enabled = () => true) {
    let keys = null;
    let fallback = "";
    let v = 1;
    let last = null;
    let handle = 0;
    const reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    const rvfc = "requestVideoFrameCallback" in HTMLVideoElement.prototype;

    function measure() {
        const w = video.clientWidth;
        const h = video.clientHeight;
        const ar = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : 16 / 9;
        v = w && h ? Math.min(1, w / h / ar) : 1;
    }

    function emit(pos) {
        if (pos === last) return;
        last = pos;
        onPos(pos);
    }

    function apply(t) {
        if (!keys || v >= 0.8 || !enabled()) return emit(fallback);
        const x = frameAt(keys, t, reduceMQ.matches);
        if (x == null) return emit(fallback);
        const shift = clamp(x / 100 - v / 2, 0, 1 - v);
        emit(`${((shift / (1 - v)) * 100).toFixed(2)}% 50%`);
    }

    function loop(_, meta) {
        apply(meta ? meta.mediaTime : video.currentTime);
        schedule();
    }

    function schedule() {
        if (rvfc) handle = video.requestVideoFrameCallback(loop);
        else if (!video.paused) handle = requestAnimationFrame(() => loop());
    }

    function stop() {
        if (!handle) return;
        if (rvfc) video.cancelVideoFrameCallback(handle);
        else cancelAnimationFrame(handle);
        handle = 0;
    }

    const sync = () => apply(video.currentTime);
    const onPlay = () => {
        stop();
        schedule();
    };
    const onMeta = () => {
        measure();
        sync();
    };
    const ro = new ResizeObserver(onMeta);
    ro.observe(video);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("seeked", sync);
    video.addEventListener("play", onPlay);
    reduceMQ.addEventListener("change", sync);
    measure();

    return {
        set(nextKeys, nextFallback = "") {
            keys = nextKeys?.length ? nextKeys : null;
            fallback = nextFallback;
            last = null;
            measure();
            apply(0);
            stop();
            schedule();
        },
        refresh() {
            measure();
            last = null;
            sync();
        },
        destroy() {
            stop();
            ro.disconnect();
            video.removeEventListener("loadedmetadata", onMeta);
            video.removeEventListener("seeked", sync);
            video.removeEventListener("play", onPlay);
            reduceMQ.removeEventListener("change", sync);
        },
    };
}
