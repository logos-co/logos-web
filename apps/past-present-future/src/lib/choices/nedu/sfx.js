let actx = null,
	bus = null,
	noiseBuf = null;

export function initAudio() {
	try {
		if (!actx) {
			actx = new (window.AudioContext || window.webkitAudioContext)();
			const hp = actx.createBiquadFilter();
			hp.type = 'highpass';
			hp.frequency.value = 140;
			const comp = actx.createDynamicsCompressor();
			comp.threshold.value = -20;
			comp.knee.value = 20;
			comp.ratio.value = 8;
			comp.attack.value = 0.002;
			comp.release.value = 0.14;
			bus = actx.createGain();
			bus.gain.value = 0.9;
			bus.connect(hp);
			hp.connect(comp);
			comp.connect(actx.destination);
			const n = Math.floor(actx.sampleRate * 1.2);
			noiseBuf = actx.createBuffer(1, n, actx.sampleRate);
			const d = noiseBuf.getChannelData(0);
			for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
		}
		if (actx.state === 'suspended') actx.resume();
	} catch (e) {}
}

function env(g, t, peak, atk, dec) {
	g.gain.setValueAtTime(0.0001, t);
	g.gain.linearRampToValueAtTime(peak, t + atk);
	g.gain.exponentialRampToValueAtTime(0.0001, t + atk + dec);
}

function nz(t, freq, q, peak, dur, type) {
	if (!actx) return;
	const s = actx.createBufferSource();
	s.buffer = noiseBuf;
	s.loop = true;
	const f = actx.createBiquadFilter();
	f.type = type || 'bandpass';
	f.frequency.value = freq;
	f.Q.value = q;
	const g = actx.createGain();
	env(g, t, peak, 0.001, dur);
	s.connect(f);
	f.connect(g);
	g.connect(bus);
	s.start(t);
	s.stop(t + dur + 0.06);
}

function tone(t, freq, peak, dur, type, detune) {
	if (!actx) return;
	const o = actx.createOscillator();
	o.type = type || 'triangle';
	o.frequency.value = freq;
	if (detune) o.detune.value = detune;
	const g = actx.createGain();
	env(g, t, peak, 0.0015, dur);
	o.connect(g);
	g.connect(bus);
	o.start(t);
	o.stop(t + dur + 0.06);
}

export function sfxKey() {
	if (!actx) return;
	const t = actx.currentTime;
	nz(t, 2100 + Math.random() * 900, 2.2, 0.026, 0.011);
	nz(t, 5600, 1.2, 0.01, 0.007, 'highpass');
}

export function sfxArm() {
	if (!actx) return;
	const t = actx.currentTime;
	tone(t, 73.4, 0.055, 0.34, 'sine');
	nz(t, 1200, 3, 0.026, 0.06);
	nz(t + 0.09, 3000, 6, 0.016, 0.02);
}

export function sfxCommit() {
	if (!actx) return;
	const t = actx.currentTime;
	nz(t, 2600, 5, 0.045, 0.018);
	tone(t + 0.004, 523.3, 0.042, 0.05, 'triangle');
	tone(t + 0.1, 392.0, 0.038, 0.09, 'triangle');
	tone(t + 0.1, 98, 0.034, 0.14, 'sine');
}

/* a statement line landing on the page: a dry paper contact, no pitch */
export function sfxLine(i) {
	if (!actx) return;
	const t = actx.currentTime;
	nz(t, 1500 + ((i || 0) % 3) * 260, 3.4, 0.03, 0.016);
	nz(t + 0.012, 4200, 2, 0.012, 0.01);
	tone(t, 92, 0.02, 0.038, 'sine');
}

/* the rubber stamp coming down: a wood thud and a flat slap, nothing tonal */
export function sfxStamp() {
	if (!actx) return;
	const t = actx.currentTime;
	nz(t, 320, 1.1, 0.14, 0.055, 'lowpass');
	nz(t + 0.004, 2400, 2.6, 0.075, 0.03);
	tone(t, 66, 0.085, 0.14, 'sine');
	tone(t + 0.01, 49, 0.055, 0.2, 'sine');
}
